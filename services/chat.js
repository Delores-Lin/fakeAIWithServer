const pool = require('../db.js');
const deepseek = require('./deepseek');

exports.startChat = async (req,res,next) =>{
    console.log(req.user);
    const userId = req.user.userId;
    const [result] = await pool.query(
        'insert into chat_sessions (user_id) values (?)',[userId]
    );
    res.json({chatId:result.insertId});
}

exports.sendMessage = async (req,res,next) =>{
    const {chatId} = req.params;
    const {text,model} = req.body;
    const userId = req.user.userId;
    //获取历史消息
    const [historyRows] = await pool.query(
        'select sender,content from messages where chat_session_id = ? order by created_at',[chatId]
    );
    //历史消息格式化
    const history = historyRows.map(r => ({
        role: r.sender==='user'?'user':'assistant',
        content:r.content
    }));
    //将新消息添加到历史消息中
    history.push({role:'user',content:text});
    //发送消息
    const botMsg = await deepseek.sendMessageToDeepseek(history,model);
    //储存新的消息到数据库
	console.log(chatId);
    await pool.query(
        'insert into messages (chat_session_id,sender,content) values (?,"user",?)',
        [chatId,text]
    );
    await pool.query(
        'insert into messages (chat_session_id,sender,content) values (?,"bot",?)',
        [chatId,botMsg.content]
    );

    res.json({reply:botMsg});
};

exports.getHistory = async(req,res,next) =>{
    const {chatId} = req.params;

    const [rows] = await pool.query(
        'select sender,content,created_at from messages where chat_session_id = ? order by created_at',
        [chatId]
    );
    res.json(rows);
}
