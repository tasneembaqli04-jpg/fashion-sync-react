const { sendShippingUpdateEmail } = require("../services/emailService");

async function shippingUpdateEmailController(request, response) {
  try {
    const { toEmail, orderId, stageIndex } = request.body || {};

    if (!toEmail || !orderId) {
      return response.status(400).json({
        success: false,
        message: "toEmail and orderId are required",
      });
    }

    const result = await sendShippingUpdateEmail({
      toEmail,
      orderId,
      stageIndex,
    });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Shipping update email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  shippingUpdateEmailController,
};