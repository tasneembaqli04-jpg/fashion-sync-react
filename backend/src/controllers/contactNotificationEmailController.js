const {
  sendContactNotificationEmail,
} = require("../services/contactNotificationEmailService");

async function contactNotificationEmailController(request, response) {
  try {
    const { name, email, message } = request.body || {};

    if (!message) {
      return response.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    const result = await sendContactNotificationEmail({ name, email, message });

    return response.status(200).json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Contact notification email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  contactNotificationEmailController,
};