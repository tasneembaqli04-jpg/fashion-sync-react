const {GoogleGenAI} = require("@google/genai");

const project =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "fashionsync-dc79f";

const vertexAi = new GoogleGenAI({
  vertexai: true,
  project,
  location: "us-central1",
});

module.exports = {
  vertexAi,
};