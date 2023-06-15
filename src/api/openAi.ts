import { config } from "../config";
import axios, { AxiosResponse } from "axios";

const apiKey = config.openAiKey;
const apiUrl = config.openAiUrl;

const openApi = axios.create({
  baseURL: `${apiUrl}`,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
});

export async function postGenerateImg(
  prompt: string,
  sendProgressToUser: () => void,
  numImgs?: number,
  imgSize?: string
) {
  try {
    const payload = {
      prompt: prompt,
      n: numImgs ? numImgs : config.sessionDefault.numImages,
      size: imgSize ? imgSize : config.sessionDefault.imgSize,
    };
    console.log(payload);
    const response = await openApi.post("/images/generations", payload);

    if (response.status === 200) {
      sendProgressToUser();
    } else {
      throw "There was an error generating the image";
    }
    // const data = await response.json();
    return response.data.data;
  } catch (error) {
    console.error("postGenerateImg ERROR:", error);
    throw error;
  }
}

// export async function editGeneatedImg(
//   prompt: string,
//   image: string,
//   sendProgressToUser: () => void,
//   numImgs?: number,
//   imgSize?: string
// ) {
//   try {
//     const otterResponse: AxiosResponse<ArrayBuffer> = await axios.get(image, { responseType: 'arraybuffer' });
//     const otterArrayBuffer = otterResponse.data;
//     const otterUint8Array = new Uint8Array(otterArrayBuffer);

    
//     const payload = {
//       image: new Blob([otterUint8Array]),
//       prompt: prompt,
//       n: numImgs ? numImgs : config.sessionDefault.numImages,
//       size: imgSize ? imgSize : config.sessionDefault.imgSize,
//     };
//     console.log(payload);
//     const response = await openApi.post("/images/edits", payload);

//     if (response.status === 200) {
//       sendProgressToUser();
//     } else {
//       throw "There was an error editing the image";
//     }
//     // const data = await response.json();
//     return response.data.data;
//   } catch (error) {
//     console.error("postGenerateImg ERROR:", error);
//     throw error;
//   }
// }

export async function improvePrompt(promptText: string) {
  const prompt = `Improve this image description using max 100 words and don't add additional text: ${promptText} `;
  try {
    const payload = {
      model: config.completions.model,
      prompt: prompt,
      max_tokens: config.completions.maxTokens,
      temperature: config.completions.temperature,
    };
    const response = await openApi.post("/completions", payload);
    console.log(response.data.choices[0].text);
    return response.data.choices[0].text;
  } catch (e) {
    console.error("improvePrompt Error:", e);
    return null;
  }
}
