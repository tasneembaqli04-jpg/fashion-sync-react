const {
  sendContactReplyEmail,
} = require("../../services/email/contactReplyEmailService");

/**
 * Sends the manager's reply to an enquiry.
 *
 * A failure is reported rather than swallowed: the manager needs to know that
 * her answer did not go, because the record on her screen would otherwise show
 * a reply the customer never received.
 *
 * @param {object} request HTTP request.
 * @param {object} response HTTP response.
 * @return {Promise<object>} The response.
 */
async function contactReplyEmailController(request, response) {
  try {
    const {toEmail, name, originalMessage, replyText} = request.body || {};

    if (!toEmail || !replyText) {
      return response.status(400).json({
        success: false,
        message: "toEmail and replyText are required",
      });
    }

    await sendContactReplyEmail({toEmail, name, originalMessage, replyText});

    return response.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Contact reply email controller error:", error);

    return response.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  contactReplyEmailController,
};
