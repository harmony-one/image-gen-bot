import * as dotenv from 'dotenv'
dotenv.config()

export const config = {
  isProduction: process.env.NODE_ENV ? process.env.NODE_ENV !== 'development' : false,
  port: process.env.PORT || 3000,
  telegramAPI : process.env.TELEGRAM_HTTP_KEY,
  openAiKey: process.env.OPENAI_API_KEY,
  completions: {
    model: 'text-davinci-003',
    maxTokens: 140,
    temperature: 0.8
  },
  sessionDefault: {
    numImages: 1,
    lastImages: [],
    imgSize: '1024x1024'
  },
  queue: {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_DEFAULT_PASSWORD
    }
  }
}
