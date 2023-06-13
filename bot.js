let TelegramBot = require("node-telegram-bot-api");
const { config } = require("./config");
const { postGenerateImg, improvePrompt } = require("./api/openAi");

const token = config.telegramAPI;
let bot = new TelegramBot(token, { polling: true });

// // Matches "/echo [whatever]"
// bot.onText(/\/help(.+)/, (msg, match) => {
//   console.log('onText',match[0],match[1])
//   // console.log(msg)
//     console.log(match[1])
//     let chatId = msg.chat.id;

//     let resp = 'This bot '

//     bot.sendMessage(chatId, resp);
// });

bot.onText(/\/genEn(.+)/, async (msg, match) => {
  console.log("genEn", match[1]);
  let chatId = msg.chat.id;
  let prompt = match[1];
  try {
    bot.sendMessage(chatId, "generating improved prompt...");
    const upgratedPrompt = await improvePrompt(prompt);
    if (upgratedPrompt) {
      bot.sendMessage(
        chatId,
        `The following description was added to your prompt: ${upgratedPrompt}`
      );
      const img = await postGenerateImg(upgratedPrompt, () =>
        bot.sendMessage(chatId, "generating the image...")
      );
      bot.sendPhoto(chatId, img);
    } else {
      const img = await postGenerateImg(prompt, () =>
        bot.sendMessage(chatId, "generating the image...")
      );
      bot.sendPhoto(chatId, img);
    }
  } catch (e) {
    console.log("/genEn Error", e);
    bot.sendMessage(chatId, "There was an error while generating the image");
  }
  return;
});

// improvePrompt('spider soup')

// bot.onText(/\/gen(.+)/, async (msg, match) => {
//   let chatId = msg.chat.id;
//   let prompt = match[1];
//   try {
//     const img = await postGenerateImg(prompt,() => bot.sendMessage(chatId,'generating the image...'))
//     bot.sendPhoto(chatId,img); //.sendMessage(chatId, img);
//   } catch(e) {
//     bot.sendMessage(chatId,'There was an error while generating the image')
//   }
// });
