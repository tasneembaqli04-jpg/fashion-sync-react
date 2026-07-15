const { sendOrderConfirmationEmail } = require("../services/emailService");

async function emailController(request, response) {
  try {
    const { toEmail, order } = request.body || {};

    if (!toEmail || !order) {
      return response.status(400).json({
        success: false,
        message: "toEmail and order are required",
      });
    }

    const result = await sendOrderConfirmationEmail({ toEmail, order });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  emailController,
};