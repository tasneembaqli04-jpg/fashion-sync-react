const {
  sendVerificationCodeEmail,
} = require("../../services/email/verificationEmailService");

async function verificationEmailController(request, response) {
  try {
    const { toEmail, code, lang } = request.body || {};

    if (!toEmail || !code) {
      return response.status(400).json({
        success: false,
        message: "toEmail and code are required",
      });
    }

    const result = await sendVerificationCodeEmail({ toEmail, code, lang });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Verification email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  verificationEmailController,
};