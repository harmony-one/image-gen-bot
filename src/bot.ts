import {
  Bot,
  Context,
  session,
  SessionFlavor,
  webhookCallback,
  MemorySessionStorage,
} from 'grammy';
import express from 'express';

import {
  mainMenu,
  numImagesOptions,
  setImgOption,
  setImgSizeOption,
  getMenu,
  imgSizeOptions
} from './telegram/inlineKeyboard';

import { improvePrompt, postGenerateImg } from './api/openAi'; //editGeneatedImg
import { config } from './config';
import { appText } from './util/text';

console.log('CONFIG', config.isProduction, config.port, config.completions);

interface Image {
  url: string
}
interface SessionData {
  numImages: number;
  lastImages: Image[];
  imgSize: string
}

export type MyContext = Context & SessionFlavor<SessionData>;

const token = config.telegramAPI;
const bot = new Bot<MyContext>(token || '');

function initial(): SessionData {
  return {
    numImages: config.sessionDefault.numImages,
    lastImages: config.sessionDefault.lastImages,
    imgSize: config.sessionDefault.imgSize,
  };
}

bot.use(session({ initial, storage: new MemorySessionStorage() }));

bot.command('start', async (ctx) => {
  console.log('start command');
  await ctx.reply(appText.welcomeText, { parse_mode: 'HTML' });
  await getMenu(mainMenu, ctx);
});

bot.command('help', async (ctx) => {
  console.log('help command', ctx.session);
  await ctx.reply(appText.welcomeText, { parse_mode: 'HTML' });
  await getMenu(mainMenu, ctx);
});

bot.callbackQuery('numImagesOptions', async (ctx) => {
  await ctx.editMessageText(numImagesOptions.menuText, {
    reply_markup: numImagesOptions.menu,
    parse_mode: 'HTML',
  });
});

bot.callbackQuery('imgSizeOptions', async (ctx) => {
  await ctx.editMessageText(imgSizeOptions.menuText, {
    reply_markup: imgSizeOptions.menu,
    parse_mode: 'HTML',
  });
});

bot.callbackQuery('back', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(mainMenu.menuText, {
    reply_markup: mainMenu.menu,
    parse_mode: 'HTML',
  });
});

bot.callbackQuery('imgOptionSelected1', async (ctx) => {
  setImgOption(1, ctx);
});

bot.callbackQuery('imgOptionSelected2', async (ctx) => {
  setImgOption(2, ctx);
});

bot.callbackQuery('imgOptionSelected3', async (ctx) => {
  setImgOption(3, ctx);
});

bot.callbackQuery('imgSizeSelected256', async (ctx) => {
  setImgSizeOption('256x256', ctx);
});

bot.callbackQuery('imgSizeSelected512', async (ctx) => {
  setImgSizeOption('512x512', ctx);
});

bot.callbackQuery('imgSizeSelected1024', async (ctx) => {
  setImgSizeOption('1024x1024', ctx);
});


bot.command('gen', async (ctx) => {
  console.log('gen command');
  const prompt = ctx.match;
  if (!prompt) {
    ctx.reply('Error: Missing prompt');
    return;
  }
  try {
    const numImages = await ctx.session.numImages
    const imgSize = await ctx.session.imgSize
    const imgs = await postGenerateImg(prompt, () =>
      ctx.reply('generating the image...'),
      numImages,
      imgSize
    );
    ctx.session.lastImages = imgs;
    imgs.map((img: any) => {
      ctx.replyWithPhoto(img.url);
    });
  } catch (e) {
    ctx.reply('There was an error while generating the image');
  }
});

bot.command('genEn', async (ctx) => {
  console.log('genEn command');
  const prompt = ctx.match;
  if (!prompt) {
    ctx.reply('Error: Missing prompt');
    return;
  }
  try {
    ctx.reply('generating improved prompt...');
    const upgratedPrompt = await improvePrompt(prompt);
    if (upgratedPrompt) {
      ctx.reply(
        `The following description was added to your prompt: ${upgratedPrompt}`
      );
    }
    const numImages = await ctx.session.numImages
    const imgSize = await ctx.session.imgSize
    const imgs = await postGenerateImg(upgratedPrompt || prompt, 
      () => ctx.reply('generating the image...'), 
      numImages,
      imgSize
    );
    ctx.session.lastImages = imgs;
    imgs.map((img: any) => {
      ctx.replyWithPhoto(img.url);
    });
  } catch (e) {
    // console.log('/genEn Error', e);
    ctx.reply('There was an error while generating the image');
  }
});

// bot.command('edit', async (ctx) => {
//   console.log('edit command');
//   const prompt = ctx.match;
//   if (!prompt) {
//     ctx.reply('Error: Missing prompt');
//     return;
//   }
//   try {
//     const imgToEdit = await ctx.session.lastImages[0].url
//     const numImages = await ctx.session.numImages
//     const imgSize = await ctx.session.imgSize
//     const imgs = await editGeneatedImg(prompt, imgToEdit, () =>
//       ctx.reply('generating the image...'),
//       numImages,
//       imgSize
//     );
//     // ctx.session.lastImages = imgs;
//     imgs.map((img: any) => {
//       ctx.replyWithPhoto(img.url);
//     });
//   } catch (e) {
//     ctx.reply('There was an error while generating the image');
//   }
// });

if (config.isProduction) {
  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, 'express'));

  const PORT = config.port;
  //@ts-ignore
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  console.log('Bot started (development)');
  bot.start();
}
