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

const options = {
	key: fs.readFileSync('/etc/letsencrypt/live/delolin.me/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/delolin.me/fullchain.pem')
};
https.createServer(options,app).listen(443,() =>{
	console.log('HTTP running on ...');
});

app.use(express.json({ limit: '10kb' }));
app.use(cors());//允许跨域请求
app.use(helmet());
app.use(morgan('combined'));
app.use(limiter);


const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

const generateToken = (userId) => {
    return jwt.sign({userId},process.env.JWT_SECRET,{expiresIn: '1h'});
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
        const hashedPassword = await bcrypt.hash(password,10);
        const [result] = await pool.query(
            'insert into users (username,email,password) values (?,?,?)',
            [username,email,hashedPassword]
        );
        const token = generateToken(result.insertId);
        res.status(201).json({
            userId:result.insertId,
            username:username,
            token:token,
        });
    }catch(error) {
        next(error);
    }
})

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
        if(!validPassword) {
            return res.status(402).json({error:'邮箱或密码错误'});
        }

        const token = generateToken(user.id);
        res.json({
            userId: user.id,
            userName: user.username,
            token:token
        });
    }catch(error){
        next(error);
    }
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

