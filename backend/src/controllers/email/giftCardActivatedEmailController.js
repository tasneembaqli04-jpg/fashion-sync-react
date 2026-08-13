const {
  sendGiftCardActivatedEmail,
} = require("../../services/email/emailService");

async function giftCardActivatedEmailController(request, response) {
  try {
    const {toEmail, giftCardCode, amount, lang} = request.body || {};

    if (!toEmail || !giftCardCode) {
      return response.status(400).json({
        success: false,
        message: "toEmail and giftCardCode are required",
      });
    }

    const result = await sendGiftCardActivatedEmail({
      toEmail,
      giftCardCode,
      amount,
      lang,
    });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Gift card activated email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  giftCardActivatedEmailController,
};
