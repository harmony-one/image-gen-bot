import {
  Bot,
  Context,
  session,
  SessionFlavor,
  InlineKeyboard,
  webhookCallback,
  MemorySessionStorage,
} from "grammy";
import { improvePrompt, postGenerateImg } from "./api/openAi";
import { config } from "./config";
import express from "express";
import { appText } from "./util/text";

console.log("CONFIG", config.isProduction, config.port, config.completions);
interface SessionData {
  numImages: number;
  lastImages: string[];
  enhancedModel: string;
}

type MyContext = Context & SessionFlavor<SessionData>;

const token = config.telegramAPI;
const bot = new Bot<MyContext>(token || "");

function initial(): SessionData {
  return {
    numImages: config.sessionDefault.numImages,
    lastImages: config.sessionDefault.lastImages,
    enhancedModel: config.completions.model,
  };
}

bot.use(session({ initial, storage: new MemorySessionStorage() }));

bot.command("start", (ctx) => {
  console.log("start command");
  ctx.reply(appText.welcomeText, { parse_mode: "HTML" });
});

bot.command("help", (ctx) => {
  console.log("help command");
  ctx.reply(`${ctx.session.numImages}`)
  ctx.reply(appText.welcomeText, { parse_mode: "HTML" });
});

bot.command("gen", async (ctx) => {
  console.log("gen command");
  const prompt = ctx.match;
  if (!prompt) {
    ctx.reply("Error: Missing prompt");
    return;
  }
  try {
    const imgs = await postGenerateImg(prompt, () =>
      ctx.reply("generating the image...")
    );
    ctx.session.lastImages = imgs;
    imgs.map((img: any) => {
      ctx.replyWithPhoto(img.url);
    });
  } catch (e) {
    ctx.reply("There was an error while generating the image");
  }
});

bot.command("genEn", async (ctx) => {
  console.log("genEn command");
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
    ctx.session.lastImages = imgs;
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
  //@ts-ignore
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  console.log("Bot started (development)");
  bot.start();
}
