const {
  sendPasswordResetEmail,
} = require("../services/passwordResetEmailService");

async function passwordResetEmailController(request, response) {
  try {
    const { toEmail, lang } = request.body || {};

    if (!toEmail) {
      return response.status(400).json({
        success: false,
        message: "toEmail is required",
      });
    }

    try {
      await sendPasswordResetEmail({ toEmail, lang });
    } catch (innerError) {
      if (innerError.code !== "auth/user-not-found") {
        console.error("Password reset email inner error:", innerError);
      }
    }

    return response.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Password reset email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  passwordResetEmailController,
};