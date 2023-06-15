declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: "development" | "production";
      PORT?: number;
      TELEGRAM_HTTP_KEY: string;
      OPENAI_API_KEY: string;
      OPENAI_API_URL: string;
    }
  }
}

export {};