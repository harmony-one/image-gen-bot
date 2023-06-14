import * as dotenv from 'dotenv'
dotenv.config()

export const config = {
  isProduction: process.env.NODE_ENV ? process.env.NODE_ENV !== 'development' : false,
  port: process.env.PORT || 3000,
  telegramAPI : process.env.TELEGRAM_HTTP_KEY,
  openAiKey: process.env.OPENAI_API_KEY,
  openAiUrl: process.env.OPENAI_API_URL,
  completions: {
    model: 'text-davinci-003',
    maxTokens: 140,
    temperature: 0.8
  }
}
