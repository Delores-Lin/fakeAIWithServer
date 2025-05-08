const pool = require('../db.js');
const deepseek = require('./deepseek');
const {marked} = require('marked');

exports.startChat = async (req,res,next) =>{
    console.log(req.user);
    const userId = req.user.userId;
    const {title} = req.body;
    const [result] = await pool.query(
        'insert into chat_sessions (user_id,title) values (?,?)',[userId,title]
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
    let botContent = '';
    let botReasoningContent = '';
    //将新消息添加到历史消息中
    history.push({role:'user',content:text});
    console.log(history);
    try{
        //事件流
        res.setHeader('content-Type','text/event-stream');
        res.setHeader('Cache-Control','no-cache');
        res.flushHeaders();
        //发送消息
        const botMsg = await deepseek.sendMessageToDeepseek(history,model);

        for await (const part of botMsg){
            const delta = part.choices[0].delta || {};
            if(delta.reasoning_content){
                botReasoningContent+=delta.reasoning_content;
                res.write(`reasoning_data:${JSON.stringify({chunck:delta.reasoning_content})}`);
            }
            if(delta.content){
                botContent+=delta.content;
		console.log(delta.content);
                res.write(`data:${JSON.stringify({ chunck: delta.content})}\n\n`);
            }
        }
    //储存新的消息到数据库
    await pool.query(
        'insert into messages (chat_session_id,sender,content) values (?,"user",?)',
        [chatId,text]
    );
    const markReasoningContent = marked(botReasoningContent || '');
    const markBotContent = marked(botContent || '');
    await pool.query(
        'insert into messages (chat_session_id,sender,content,reasoning_content) values (?,"bot",?,?)',
        [chatId,markBotContent,markReasoningContent]
    );
        res.write(`event:done\ndata:{}\n\n`);
        res.end();
    }catch(error){
        console.log(error);
    }
};

exports.getHistoryChatList = async(req,res,next) =>{
    const {userId} = req.user;
    try{
        const [rows] = await pool.query(
            'select id as chatId, created_at,title from chat_sessions where user_id = ? order by created_at DESC',
            [userId]
        );
        res.json({rows});
    }catch(err){
        console.error(err);
    }
}

exports.getHistoryChatContent = async(req,res,next) =>{
    const { chatId } = req.params;
    try{
        const [rows] = await pool.query(
            'SELECT sender, content,reasoning_content created_at FROM messages WHERE chat_session_id = ? ORDER BY created_at',
            [chatId]
        );
        res.json(rows);
    }catch(err){
        console.error(err);
    }
}
