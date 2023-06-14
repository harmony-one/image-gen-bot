import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import { improvePrompt, postGenerateImg } from "./api/openAi";
import { config } from "./config";
import express from "express";

const token = config.telegramAPI;
const bot = new Bot(token || "");

// // Matches "/echo [whatever]"
// bot.onText(/\/help(.+)/, (msg, match) => {
//   console.log('onText',match[0],match[1])
//   // console.log(msg)
//     console.log(match[1])
//     let chatId = msg.chat.id;

//     let resp = 'This bot '

//     bot.sendMessage(chatId, resp);
// });

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
      ctx.replyWithPhoto(img.url)
    })
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
        ctx.replyWithPhoto(img.url)
      })
  } catch (e) {
    console.log("/genEn Error", e);
    ctx.reply("There was an error while generating the image");
  }
});

bot.start();
