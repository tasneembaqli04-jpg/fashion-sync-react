const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  vertexai: true,
  project: "fashionsync-dc79f",
  location: "us-central1",
});

module.exports = {
  ai,
};