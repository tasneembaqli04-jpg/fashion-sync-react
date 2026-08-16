const {geminiApiKey} = require("./config/gemini");
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

const gmailUser = defineSecret("GMAIL_USER");
const gmailAppPassword = defineSecret("GMAIL_APP_PASSWORD");

const {tryOnController} = require("./controllers/tryOn/tryOnController");
const {tryOnV2Controller} = require("./controllers/tryOn/tryOnV2Controller");
const {chatController} = require("./controllers/chat/chatController");
const {emailController} = require("./controllers/email/emailController");
const {
  stockAlertEmailController,
} = require("./controllers/email/stockAlertEmailController");
const {
  shippingUpdateEmailController,
} = require("./controllers/email/shippingUpdateEmailController");
const {
  giftCardActivatedEmailController,
} = require("./controllers/email/giftCardActivatedEmailController");
const {
  orderRejectedEmailController,
} = require("./controllers/email/orderRejectedEmailController");
const {
  giftCardRejectedEmailController,
} = require("./controllers/email/giftCardRejectedEmailController");
const {
  returnStatusEmailController,
} = require("./controllers/email/returnStatusEmailController");
const {
  orderCancellationEmailController,
} = require("./controllers/email/orderCancellationEmailController");
const {
  pickupScheduledEmailController,
} = require("./controllers/email/pickupScheduledEmailController");
const {
  verificationEmailController,
} = require("./controllers/email/verificationEmailController");
const {
  welcomeEmailController,
} = require("./controllers/email/welcomeEmailController");
const {
  contactNotificationEmailController,
} = require("./controllers/email/contactNotificationEmailController");
const {
  contactReplyEmailController,
} = require("./controllers/email/contactReplyEmailController");
const {
  passwordResetEmailController,
} = require("./controllers/email/passwordResetEmailController");


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
      secrets: [geminiApiKey],
    },
    chatController,
);

const sendOrderEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    emailController,
);

const sendStockAlertEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    stockAlertEmailController,
);

const sendShippingUpdateEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    shippingUpdateEmailController,
);
const sendGiftCardActivatedEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    giftCardActivatedEmailController,
);

const sendOrderRejectedEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    orderRejectedEmailController,
);

const sendGiftCardRejectedEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    giftCardRejectedEmailController,
);

const sendReturnStatusEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    returnStatusEmailController,
);

const sendOrderCancellationEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    orderCancellationEmailController,
);
const sendPickupScheduledEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    pickupScheduledEmailController,
);

const sendVerificationEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    verificationEmailController,
);

const sendWelcomeEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    welcomeEmailController,
);

const sendContactNotificationEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    contactNotificationEmailController,
);

const sendContactReplyEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    contactReplyEmailController,
);

const sendPasswordResetEmail = onRequest(
    {
      cors: true,
      secrets: [gmailUser, gmailAppPassword],
    },
    passwordResetEmailController,
);

module.exports = {
  backendHealthCheck,
  tryOn,
  tryOnV2,
  chat,
  sendOrderEmail,
  sendStockAlertEmail,
  sendShippingUpdateEmail,
  sendGiftCardActivatedEmail,
  sendOrderRejectedEmail,
  sendGiftCardRejectedEmail,
  sendReturnStatusEmail,
  sendOrderCancellationEmail,
  sendPickupScheduledEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendContactNotificationEmail,
  sendContactReplyEmail,
  sendPasswordResetEmail,
};
