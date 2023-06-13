require('dotenv').config()

const config = {
  telegramAPI : process.env.TELEGRAM_HTTP_KEY,
  openAiKey: process.env.OPENAI_API_KEY,
  openAiUrl: process.env.OPENAI_API_URL,
  completions: {
    model: 'text-davinci-003',
    maxTokens: 140,
    temperature: 0.8
  }
}

module.exports = { config }