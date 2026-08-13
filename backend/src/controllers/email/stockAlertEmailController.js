const {
  sendStockAlertEmail,
} = require("../../services/email/emailService");

async function stockAlertEmailController(request, response) {
  try {
    const { toEmail, productName, productNameEn, lang } = request.body || {};

    if (!toEmail) {
      return response.status(400).json({
        success: false,
        message: "toEmail is required",
      });
    }

    const result = await sendStockAlertEmail({ toEmail, productName, productNameEn, lang });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Stock alert email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  stockAlertEmailController,
};