import {
  Bot,
  Context,
  session,
  SessionFlavor,
  webhookCallback,
  MemorySessionStorage,
} from "grammy";
import express from "express";
import { Queue } from "bullmq";

import { taskWorker } from './workers/task-worker'
import {
  mainMenu,
  numImagesOptions,
  setImgOption,
  setImgSizeOption,
  getMenu,
  imgSizeOptions,
} from "./telegram/inlineKeyboard";
import { config } from "./config";
import { appText } from "./util/text";

interface Image {
  url: string;
}
interface SessionData {
  numImages: number;
  lastImages: Image[];
  imgSize: string;
}

export type MyContext = Context & SessionFlavor<SessionData>;

const token = config.telegramAPI;

export const bot = new Bot<MyContext>(token || "");

console.log("CONFIG", config.isProduction, config.port, config.completions);

const taskQueue = new Queue('botTask', { connection: config.queue.connection });

function initial(): SessionData {
  return {
    numImages: config.sessionDefault.numImages,
    lastImages: config.sessionDefault.lastImages,
    imgSize: config.sessionDefault.imgSize,
  };
}

bot.use(session({ initial, storage: new MemorySessionStorage() }));

bot.command("start", async (ctx) => {
  console.log("start command");
  await ctx.reply(appText.welcomeText, { parse_mode: "HTML" });
  await getMenu(mainMenu, ctx);
});

bot.command("help", async (ctx) => {
  console.log("help command", ctx.session);
  await ctx.reply(appText.welcomeText, { parse_mode: "HTML" });
  await getMenu(mainMenu, ctx);
});

bot.callbackQuery("numImagesOptions", async (ctx) => {
  await ctx.editMessageText(numImagesOptions.menuText, {
    reply_markup: numImagesOptions.menu,
    parse_mode: "HTML",
  });
});

bot.callbackQuery("imgSizeOptions", async (ctx) => {
  await ctx.editMessageText(imgSizeOptions.menuText, {
    reply_markup: imgSizeOptions.menu,
    parse_mode: "HTML",
  });
});

bot.callbackQuery("back", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(mainMenu.menuText, {
    reply_markup: mainMenu.menu,
    parse_mode: "HTML",
  });
});

bot.callbackQuery("imgOptionSelected1", async (ctx) => {
  setImgOption(1, ctx);
});

bot.callbackQuery("imgOptionSelected2", async (ctx) => {
  setImgOption(2, ctx);
});

bot.callbackQuery("imgOptionSelected3", async (ctx) => {
  setImgOption(3, ctx);
});

bot.callbackQuery("imgSizeSelected256", async (ctx) => {
  setImgSizeOption("256x256", ctx);
});

bot.callbackQuery("imgSizeSelected512", async (ctx) => {
  setImgSizeOption("512x512", ctx);
});

bot.callbackQuery("imgSizeSelected1024", async (ctx) => {
  setImgSizeOption("1024x1024", ctx);
});

bot.command("gen", async (ctx) => {
  console.log("gen command");
  const prompt = ctx.match;
  if (!prompt) {
    ctx.reply("Error: Missing prompt");
    return;
  }
  const workerPayload = {
    chatId: ctx.chat.id,
    prompt: ctx.match,
    numImages: await ctx.session.numImages,
    imgSize: await ctx.session.imgSize
  }
  await taskQueue.add('gen', workerPayload );
});

bot.command("genEn", async (ctx) => {
  console.log("genEn command");
  const prompt = ctx.match;
  if (!prompt) {
    ctx.reply("Error: Missing prompt");
    return;
  }
  const workerPayload = {
    chatId: ctx.chat.id,
    prompt: ctx.match,
    numImages: await ctx.session.numImages,
    imgSize: await ctx.session.imgSize
  }
  await taskQueue.add('genEn', workerPayload );
  ctx.reply("generating improved prompt...");
});

bot.on("message", async (ctx) => {
  console.log(ctx.message.text,ctx.chat.id,ctx.chat.type)
  try {
    const photo = ctx.message.photo || ctx.message.reply_to_message?.photo;
    if (photo) {
      const prompt = ctx.message.caption || ctx.message.text;
      if (prompt) {
        const file_id = photo.pop()?.file_id; // with pop() get full image quality
        const file = await ctx.api.getFile(file_id!);
        const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
        console.log("File path", filePath);
        const workerPayload = {
          chatId: ctx.chat.id,
          prompt: prompt,
          numImages: await ctx.session.numImages,
          imgSize: await ctx.session.imgSize,
          filePath: filePath
        }
        await taskQueue.add('alterGeneratedImg', workerPayload );
      } else {
        ctx.reply("Please add edit prompt");
      }
    }
  } catch (e: any) {
    console.log(e);
    ctx.reply("An error occurred while generating the AI edit");
  }
});

taskWorker.run()

taskQueue.on('error', (e) => {
  console.log('taskQueue Error', e.message)
})

taskWorker.on('error', (e) => {
  console.log('taskWorker Error', e.message)
})

process.on("SIGINT", async () => {
  await taskWorker.close();
});


if (config.isProduction) {
  const app = express();
  app.use(express.json());
  // app.use(`/${bot.token}`, webhookCallback(bot, "express"));
  app.use(webhookCallback(bot, "express"));
  app.use((_req, res) => res.status(200).send());

  const PORT = config.port;
  //@ts-ignore
  // app.listen(PORT, () => console.log(`listening on port ${PORT}`));
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  console.log("Bot started (development)");
  bot.start();
}
