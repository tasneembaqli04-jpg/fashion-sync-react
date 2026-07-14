const {onRequest} = require("firebase-functions/v2/https");
const {tryOnController} = require("./controllers/tryOnController");

const backendHealthCheck = onRequest((request, response) => {
  response.status(200).json({
    success: true,
    message: "FashionSync backend is working",
  });
});

const tryOn = onRequest(
  {
    cors: true,
  },
  tryOnController,
);

module.exports = {
  backendHealthCheck,
  tryOn,
};