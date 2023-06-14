import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import { improvePrompt, postGenerateImg } from "./api/openAi";
import { config } from "./config";
import express from "express";

console.log('CONFIG',config)

const token = config.telegramAPI;
const bot = new Bot(token || "");

bot.command("help", (ctx) => {
  const helpText = `Hello! I'm a Telegram bot that generates AI Images using OpenAI technology.

  <b>Commands</b>
  /help - This menu
  /gen [text] - Generates an Image from a given prompt
  /genEn [text] - Generates an Image from an enhanced prompt`;

  ctx.reply(helpText, { parse_mode: "HTML" });
});

bot.command("gen", async (ctx) => {
  const prompt = ctx.match;
  if (!prompt) {
    ctx.reply("Error: Missing prompt");
    return;
  }
  try {
    const imgs = await postGenerateImg(prompt, () =>
      ctx.reply("generating the image...")
    );
    imgs.map((img: any) => {
      ctx.replyWithPhoto(img.url);
    });
  } catch (e) {
    ctx.reply("There was an error while generating the image");
  }
});

bot.command("genEn", async (ctx) => {
  const prompt = ctx.match;
  if (!prompt) {
    ctx.reply("Error: Missing prompt");
    return;
  }
  try {
    ctx.reply("generating improved prompt...");
    const upgratedPrompt = await improvePrompt(prompt);
    if (upgratedPrompt) {
      ctx.reply(
        `The following description was added to your prompt: ${upgratedPrompt}`
      );
    }
    const imgs = await postGenerateImg(upgratedPrompt || prompt, () =>
      ctx.reply("generating the image...")
    );
    imgs.map((img: any) => {
      ctx.replyWithPhoto(img.url);
    });
  } catch (e) {
    console.log("/genEn Error", e);
    ctx.reply("There was an error while generating the image");
  }
});

if (config.isProduction) {

  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, "express"));

  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  console.log('Bot started (development)');
  bot.start();
}
