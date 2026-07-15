const { sendStockAlertEmail } = require("../services/emailService");

async function stockAlertEmailController(request, response) {
  try {
    const { toEmail, productName } = request.body || {};

    if (!toEmail) {
      return response.status(400).json({
        success: false,
        message: "toEmail is required",
      });
    }

    const result = await sendStockAlertEmail({ toEmail, productName });

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