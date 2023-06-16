import { Configuration, 
  OpenAIApi, 
  CreateImageRequest, 
  CreateCompletionRequest } from "openai";

import { config } from "../config";
import { deleteFile, getImage } from "../util/file";

const apiKey = config.openAiKey;

const configuration = new Configuration({
  apiKey: apiKey,
});

const openai = new OpenAIApi(configuration);

export async function postGenerateImg(
  prompt: string,
  ctx: any,
  numImgs?: number,
  imgSize?: string
) {
  try {
    const payload = {
      prompt: prompt,
      n: numImgs ? numImgs : config.sessionDefault.numImages,
      size: imgSize ? imgSize : config.sessionDefault.imgSize,
    };
    const response = await openai.createImage(payload as CreateImageRequest)
    ctx.reply("generating the output...");
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

export async function alterGeneratedImg(
  prompt: string,
  image: string,
  ctx: any,
  numImgs?: number,
  imgSize?: string
) {
  try {
    const imageData = await getImage(image, ctx);
    if (imageData) {
      ctx.reply("validating image... ");
      let response;
      const size = imgSize ? imgSize : config.sessionDefault.imgSize;
      if (isNaN(+prompt)) {
        const n = numImgs ? numImgs : config.sessionDefault.numImages;
        response = await openai.createImageEdit(
          imageData.file,
          prompt,
          undefined,
          n,
          size
        );
      } else {
        const size = imgSize ? imgSize : config.sessionDefault.imgSize;
        const n = parseInt(prompt)
        response = await openai.createImageVariation(
          imageData.file,
          n > 10 ? 1 : n,
          size
        );
      }
      ctx.reply("generating the output...");
      deleteFile(imageData.fileName)
      return response.data.data;
    }
  } catch (error: any) {
    throw error;
  }
}

export async function improvePrompt(promptText: string) {
  const prompt = `Improve this image description using max 100 words and don't add additional text: ${promptText} `;
  try {
    const payload = {
      model: config.completions.model,
      prompt: prompt,
      max_tokens: config.completions.maxTokens,
      temperature: config.completions.temperature,
    };
    const response = await openai.createCompletion(payload as CreateCompletionRequest); 
    return response.data.choices[0].text;
  } catch (e) {
    throw e 
  }
}
