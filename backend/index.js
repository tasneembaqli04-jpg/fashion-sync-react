const {
  backendHealthCheck,
  tryOn,
  tryOnV2,
  chat,
  sendOrderEmail,
  sendStockAlertEmail,
  sendShippingUpdateEmail,
  sendReturnStatusEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendContactNotificationEmail,
  sendPasswordResetEmail,
  sendOrderCancellationEmail,
} = require("./src");

exports.backendHealthCheck = backendHealthCheck;
exports.tryOn = tryOn;
exports.tryOnV2 = tryOnV2;
exports.chat = chat;
exports.sendOrderEmail = sendOrderEmail;
exports.sendStockAlertEmail = sendStockAlertEmail;
exports.sendShippingUpdateEmail = sendShippingUpdateEmail;
exports.sendReturnStatusEmail = sendReturnStatusEmail;
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendContactNotificationEmail = sendContactNotificationEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendOrderCancellationEmail = sendOrderCancellationEmail;