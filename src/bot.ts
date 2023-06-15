import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import { improvePrompt, postGenerateImg } from "./api/openAi";
import { config } from "./config";
import express from "express";

console.log('CONFIG',config.isProduction, config.port, config.completions)

const token = config.telegramAPI;
const bot = new Bot(token || "");
const welcomeText = `Hello! I'm a Telegram bot that generates AI Images using OpenAI technology.

<b>Commands</b>
/help - This menu
/gen [text] - Generates an Image from a given prompt
/genEn [text] - Generates an Image from an enhanced prompt`;

bot.command("start", (ctx) => {
  console.log('start command')
  ctx.reply(welcomeText, { parse_mode: "HTML" });
});

bot.command("help", (ctx) => {
  console.log('help command')
  ctx.reply(welcomeText, { parse_mode: "HTML" });
});

bot.command("gen", async (ctx) => {
  console.log('gen command')
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
  console.log('genEn command')
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
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  console.log('Bot started (development)');
  bot.start();
}
