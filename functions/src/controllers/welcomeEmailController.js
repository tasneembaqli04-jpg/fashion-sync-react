const { sendWelcomeEmail } = require("../services/verificationEmailService");

async function welcomeEmailController(request, response) {
  try {
    const { toEmail, name } = request.body || {};

    if (!toEmail) {
      return response.status(400).json({
        success: false,
        message: "toEmail is required",
      });
    }

    const result = await sendWelcomeEmail({ toEmail, name });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Welcome email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  welcomeEmailController,
};