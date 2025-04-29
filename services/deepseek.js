require('dotenv').config()
const {OpenAI} = require('openai');

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const base_url = "https://api.deepseek.com";

const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: DEEPSEEK_KEY,
});

async function sendMessageToDeepseek(history,model) {
  const completion = await openai.chat.completions.create({
    messages: history,
    model: model,
  });

  return completion.choices[0].message;
}

module.exports = {sendMessageToDeepseek};
