const { sendOrderRejectedEmail } = require("../services/emailService");

async function orderRejectedEmailController(request, response) {
  try {
    const { toEmail, orderId, reason, lang } = request.body || {};

    if (!toEmail || !orderId) {
      return response.status(400).json({
        success: false,
        message: "toEmail and orderId are required",
      });
    }

    const result = await sendOrderRejectedEmail({
      toEmail,
      orderId,
      reason,
      lang,
    });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Order rejected email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  orderRejectedEmailController,
};