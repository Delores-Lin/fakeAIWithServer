require('dotenv').config()
const {OpenAI} = require('openai');

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const base_url = "https://api.deepseek.com";

const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: DEEPSEEK_KEY,
});

async function sendMessageToDeepseek(history,model) {
  return openai.chat.completions.create({
    messages: history,
    model: model,
    stream:true
  });
}

module.exports = {sendMessageToDeepseek};
