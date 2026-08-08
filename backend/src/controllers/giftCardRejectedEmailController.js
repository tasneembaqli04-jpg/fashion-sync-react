const { sendGiftCardRejectedEmail } = require("../services/emailService");

async function giftCardRejectedEmailController(request, response) {
  try {
    const { toEmail, lang } = request.body || {};

    if (!toEmail) {
      return response.status(400).json({
        success: false,
        message: "toEmail is required",
      });
    }

    const result = await sendGiftCardRejectedEmail({
      toEmail,
      lang,
    });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Gift card rejected email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  giftCardRejectedEmailController,
};