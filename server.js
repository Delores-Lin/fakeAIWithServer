require('dotenv').config({path:'/root/fakeAI/.env'});
const express = require("express");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const pool = require('/root/fakeAI/db.js');
const path = require('path');

const app = express();
const PORT = 80;
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
});
const https = require('https');
const http  = require('http');
const fs = require('fs');
const cookieParser = require('cookie-parser');

const multer = require('multer');
const upload = multer();

const chatCtl = require('./services/chat');

const options = {
	key: fs.readFileSync('/etc/letsencrypt/live/delolin.me/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/delolin.me/fullchain.pem')
};
https.createServer(options,app).listen(443,() =>{
	console.log('HTTP running on ...');
});

const transporter = require('./nodemailer');

app.use(express.json({ limit: '10kb' }));
app.use(cors({credentials: true}));//允许跨域请求
app.use(helmet());
app.use(morgan('combined'));
app.use(cookieParser());
//app.use(limiter);


const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

const generateToken = (userId) => {
    return jwt.sign({userId},process.env.JWT_SECRET,{expiresIn: '7d'});
}

function validateToken(token) {
    try {
        const decoded = jwt.verify(token,SECRET_KEY);
        return decoded.userId;
    }catch(err){
        console.error('Token验证失败',err.message);
        return null;
    }
}

async function getUserData(userId) {
    try {
        const [rows] = await pool.query(
            'select id, username, email from users where id = ?',
            [userId]
        )
        return rows[0] || null;
    }catch(err) {
        console.error('用户数据查询失败',err);
        throw err;
    }
}


//用户注册
app.post('/api/register',async(req,res,next) => {
    try {
        const {email,password,username} = req.body;
	console.log('邮箱和密码：',email,password);
        if(!email || !password) {
            return res.status(400).json({error:'邮箱或密码为空'});
        }
        if(!validateEmail(email)){
            return res.status(400).json({error: '邮箱格式无效'});
        }
        if(password.length <6) {
            return res.status(400).json({error:'密码至少需要6位'});
        }
        const [existingUsers] = await pool.query('select id from users where email = ?',[email]);
        if(existingUsers.length > 0){
            return res.status(409).json({error:'邮箱已被注册'});
        }
        const emailToken = jwt.sign(
            {email: req.body.email},
            process.env.JWT_SECRET,
            {expiresIn:'1h'}
        );
        const expiresAt = new Date(Date.now() + 3600000);
        const hashedPassword = await bcrypt.hash(password,10);
        const mailOption = {
            from : `[DELOLIN] <${process.env.YEAH_EMAIL}>`,
            to: email,
            subject:'邮箱验证通知',
            html:
            `
            <div style="font-family: 'Microsoft YaHei', sans-serif;">
            <h2>感谢注册！</h2>
            <p>请点击以下链接完成验证（有效期1小时）：</p>
            <a href="${process.env.BASE_URL}/verify.html?token=${emailToken}">
            ${process.env.BASE_URL}/verify-email?token=${emailToken}
            </a>
            <p>如非本人操作，请忽略此邮件。</p>
            </div>
            `,
            text: `请访问 ${process.env.BASE_URL}/api/verify-email?token=${emailToken} 完成验证`,
        }
        mailOption.headers = {
            'X-Priority': '1', // 最高优先级
            'X-Mailer': 'MyApp Mail Service',
            'X-AntiAbuse': 'This is a verification email'
        };
        let emailCent = false;
        try{
            const info = await transporter.sendMail(mailOption);
            console.log(`邮件已发送至${email},Message ID:${info.messageId}`);
            emailCent = true;
        }catch(error){
            console.error("邮件发送失败",error);
            emailCent = false;
        }
        if(!emailCent) {
            alert("验证邮件发送失败请重试");
        }else{
	const [result] = await pool.query(
            'insert into users (username,email,password,is_varified,email_token,email_token_expires) values (?,?,?,?,?,?)',
            [   username,
                email,
                hashedPassword,
                false,
                emailToken,
                expiresAt,
            ]
        );
	}
        res.status(201).json({
            success:true,
            message:"验证邮件已发送，请检查邮箱"
        })
    }catch(error) {
        console.error(error);
    }
})

app.get('/api/verify-email', async (req, res) => {
    const { token } = req.query;

    try {
        //如果token过期则删除用户数据
        await pool.query(`DELETE FROM users WHERE is_varified = 0 AND email_token_expires < NOW()`);

        // 查询匹配且未过期的记录
        const [users] = await pool.query(
        `SELECT * FROM users 
        WHERE email_token = ? 
        AND email_token_expires > NOW() 
        AND is_varified = 0`,
        [token]
    );

    if (users.length === 0) {
        return res.status(400).json({ 
        error: '链接无效或已过期',
        reason: 'invalid_token'
        });
    }

    // 更新验证状态
    await pool.query(
        `UPDATE users 
        SET is_varified = 1, 
        email_token = NULL, 
        email_token_expires = NULL 
        WHERE id = ?`,
        [users[0].id]
    );

    res.json({ success: true });
    } catch (error) {
	console.error(error);
    res.status(500).json({ error: '验证失败' });
    }
});

app.post('/api/login',async(req,res,next) => {
    try{
        const {email,password} = req.body;
        if (!email || !password) {
            return res.status(400).json({error:'邮箱和密码位必填'});
        }
        const [users] = await pool.query('select * from users where email = ?',[email]);
        if(users.length === 0) {
            return res.status(401).json({error:'该邮箱未注册'});
        }
        const user = users[0];
        const validPassword = await bcrypt.compare(password,user.password);
        if(!user.is_varified){
            return res.status(403).json({
                error:'邮箱未验证，请前往邮箱验证'
            });
        }
        if(!validPassword) {
            return res.status(402).json({error:'邮箱或密码错误'});
        }

        const token = generateToken(user.id);
        res.cookie('authToken',token,{
            httpOnly: true,
            secure:true,
            sameSite:'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            domain: 'delolin.me',
            path: '/'
        })
        res.json({
            userId: user.id,
            userName: user.username,
            token:token
        });
    }catch(error){
        next(error);
    }
})

app.post('/api/logout',(req,res) =>{
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        domain: 'delolin.me',
        path: '/'
    });
    res.json({success: true});
})

app.get('/api/me',async (req,res,next) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const [users] = await pool.query('select id,email from users where id = ?',[decoded.userId]);
        if (users.length === 0) {
            return res.status(404).json({error:'用户不存在'});
        }
        res.json(users[0]);
    }catch(error){
        if(error.name === 'JsonWebTokenError'){
            return res.status(401).json({error:'无效令牌'});
        }
        next(error);
    }
})

app.get('/api/auth/check',async (req, res) => {
    const token = req.cookies.authToken;
    
    if(!token){
	console.log(token);
        return res.json({
            isLoggedIn: false
        })
    }
    try{
	    const SECRET_KEY = process.env.JWT_SECRET;
        const decoded = jwt.verify(token,SECRET_KEY);
        const [user] = await pool.query('select username from users where id = ?',[decoded.userId]);
        res.json({ 
            isLoggedIn: true,
            user: {
                id: decoded.userId,
                username:user[0].username
            }
        }); 
    }catch(err) {
	console.log(err);
        return res.json({
            isLoggedIn:false
        });
    }
});

//给模型发送消息获取回复
function verifyToken(req, res, next) {
const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: '未登录，缺少 token' });
    }

    try {
    	const SECRET_KEY = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: '无效或过期的 token' });
    }
}

//上传用户头像
app.post('/user/avatar',upload.single('avatar'),async(req,res,next) => {
    try{
        const file = req.file;
        if (!file) return res.status(400).send('No file uploaded');

        const [result]  = await pool.query(
            `update users set avatar_data=? , avatar_mine = ? , where id = ?`,
            [file.buffer,file.mimetype,req.user.id]
        );
        res.json({imageId:result.insertId});
    }catch(error){
        console.log(error);
    }
})

//获取用户头像
app.get('/user/avatar',verifyToken,async (req,res,next) =>{
    try{
        const [rows] = await pool.query(
            'select atatar_data,avatar_mime from users where id = ?',
            [req.user.id]
        );
        if (!rows.length || !rows[0].avatar_data) {
            return res.status(404).send('No avatar');
        }
        res.setHeader('content-Type',rows[0].avatar_mime);
        res.send(rows[0].avatar_data);
    }
})

app.post("/chat/start",verifyToken,chatCtl.startChat);
app.post('/chat/:chatId/message',verifyToken,chatCtl.sendMessage);
app.get('/chat/history/list',verifyToken,chatCtl.getHistoryChatList);
app.get('/chat/:chatId/history/content',verifyToken,chatCtl.getHistoryChatContent);

app.use(express.static(path.join(__dirname,'dist')));
app.get('/',(req,res) =>{
	const filePath = path.join(__dirname,'dist','fakeAI.html');
	console.log('servering file from:',filePath);
	res.sendFile(filePath);
})

const server = app.listen(PORT,'0.0.0.0',() =>{
    console.log(`server running on port ${PORT}`);
})


app.use((err,req,res,next)=>{
    if(!err) {
	console.error('noObject!');
    	return;
	}
    console.error('错误详情:',
	'stack:', err.stack,
	'\nmessage:', err.message,
	'\ncode:',err.code
	);

    if(err.code === 'ER_DUP_ENTRY'){
        return res.status(409).json({error:'邮箱已被注册'});
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({error: '令牌已过期'});
    }

    res.status(500).json({error:"服务器内部错误"});
})


app.use((req,res) => {
    res.status(404).json({error:'路由不存在'});
})


process.on('SIGTERM',() => {
    console.log('SIGTERM signal recieved:closing HTTP server');
    server.close(() => {
        pool.end();
        console.log('HTTP server closed');
    })
})
