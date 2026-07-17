const {onRequest} = require("firebase-functions/v2/https");

const {tryOnController} = require("./controllers/tryOnController");
const {tryOnV2Controller} = require("./controllers/tryOnV2Controller");
const {chatController} = require("./controllers/chatController");
const {emailController} = require("./controllers/emailController");
const {
  stockAlertEmailController,
} = require("./controllers/stockAlertEmailController");
const {
  shippingUpdateEmailController,
} = require("./controllers/shippingUpdateEmailController");

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

const tryOnV2 = onRequest(
  {
    cors: true,
  },
  tryOnV2Controller,
);

const chat = onRequest(
  {
    cors: true,
  },
  chatController,
);

const sendOrderEmail = onRequest(
  {
    cors: true,
  },
  emailController,
);

const sendStockAlertEmail = onRequest(
  {
    cors: true,
  },
  stockAlertEmailController,
);

const sendShippingUpdateEmail = onRequest(
  {
    cors: true,
  },
  shippingUpdateEmailController,
);

module.exports = {
  backendHealthCheck,
  tryOn,
  tryOnV2,
  chat,
  sendOrderEmail,
  sendStockAlertEmail,
  sendShippingUpdateEmail,
};