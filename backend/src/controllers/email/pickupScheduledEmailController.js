const {
  sendPickupScheduledEmail,
} = require("../../services/email/pickupScheduledEmailService");

async function pickupScheduledEmailController(request, response) {
  try {
    const {toEmail, orderId, pickupDate, pickupTime, lang} = request.body || {};

    if (!toEmail) {
      return response.status(400).json({
        success: false,
        message: "toEmail is required",
      });
    }

    const result = await sendPickupScheduledEmail({
      toEmail,
      orderId,
      pickupDate,
      pickupTime,
      lang,
    });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Pickup scheduled email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  pickupScheduledEmailController,
};
