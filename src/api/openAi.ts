import { config } from "../config";
import axios from "axios";

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
  sendProgressToUser: () => void
) {
  try {
    const payload = {
      prompt: prompt,
      n: 3,
      size: "1024x1024",
    };
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
    return response.data.choices[0].text;
  } catch (e) {
    console.error("improvePrompt Error:", e);
    return null;
  }
}
