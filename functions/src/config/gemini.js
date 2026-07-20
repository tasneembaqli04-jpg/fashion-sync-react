const {GoogleGenAI} = require("@google/genai");
const {defineSecret} = require("firebase-functions/params");

const geminiApiKey = defineSecret("GEMINI_API_KEY");

function getGeminiClient() {
  const apiKey = geminiApiKey.value();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not available");
  }

  return new GoogleGenAI({
    apiKey,
  });
}

module.exports = {
  geminiApiKey,
  getGeminiClient,
};