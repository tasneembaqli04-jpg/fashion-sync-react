const { sendReturnStatusEmail } = require("../services/returnStatusEmailService");

async function returnStatusEmailController(request, response) {
  try {
    const { toEmail, itemName, status, giftCardCode, giftCardAmount } = request.body || {};

    if (!toEmail || !status) {
      return response.status(400).json({
        success: false,
        message: "toEmail and status are required",
      });
    }

    const result = await sendReturnStatusEmail({
      toEmail,
      itemName,
      status,
      giftCardCode,
      giftCardAmount,
    });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Return status email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  returnStatusEmailController,
};