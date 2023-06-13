const { config } = require("../config");
const axios = require('axios')

const apiKey = config.openAiKey;
const apiUrl = config.openAiUrl;

const openApi = axios.create({
  baseURL: `${apiUrl}`,
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
})

async function postGenerateImg(prompt, sendProgressToUser) {
  try {
    const response = await fetch(`${apiUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      })
    });
    if (response.status === 200)  {
      console.log('RESPONSE', {response})
      sendProgressToUser()
    } else {
      throw 'There was an error generating the image'
    }
    const data = await response.json() 
    return data.data[0].url

  } catch (error) {
    console.error('postGenerateImg ERROR:', error);
    throw error
  }
}

async function improvePrompt(promptText) {
  const prompt = `Improve this image description using max 100 words and don't add additional text: ${promptText} `
  try {
    const data = {
      'model': config.completions.model,
      'prompt': prompt,
      'max_tokens': config.completions.maxTokens,
      'temperature': config.completions.temperature
    };

    const response = await openApi.post('/completions', data)

    return response.data.choices[0].text
    
  } catch (e) {
    console.error('improvePrompt Error:', e)
    return null
  }
}

module.exports = { postGenerateImg, improvePrompt }
