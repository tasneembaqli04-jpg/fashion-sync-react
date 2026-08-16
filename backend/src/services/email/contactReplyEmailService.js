const {sendMail} = require("./gmailMailer");

/**
 * Builds the reply the shop sends to someone who wrote in.
 *
 * The original question is quoted underneath. An answer often arrives days
 * later, and without it the reader is left holding a response to something she
 * no longer remembers asking.
 *
 * @param {object} options Wording for the message.
 * @param {string} options.name Who wrote in.
 * @param {string} options.originalMessage What she asked.
 * @param {string} options.replyText The manager's answer.
 * @return {string} The HTML body.
 */
function buildContactReplyHtml({name, originalMessage, replyText}) {
  const greeting = name ? `שלום ${name},` : "שלום,";

  const wrapper =
    "font-family: Arial, sans-serif; max-width: 480px;" +
    " margin: 0 auto; color: #222;";
  const answerBox =
    "background:#f5f0e8; border-radius:10px;" +
    " padding:14px; white-space:pre-wrap;";
  const quoteLabel = "color:#888; font-size:0.85em; margin-top:20px;";
  const quoteBox =
    "border-inline-start:3px solid #ddd; padding-inline-start:12px;" +
    " color:#666; white-space:pre-wrap;";
  const footer = "color: #888; font-size: 0.85em; margin-top: 24px;";

  return `
    <div dir="rtl" style="${wrapper}">
      <h2 style="color: #c9a84c;">תשובה לפנייה שלך 💬</h2>
      <p>${greeting}</p>
      <p>תודה שפנית אלינו. הנה התשובה:</p>
      <div style="${answerBox}">${replyText}</div>

      <p style="${quoteLabel}">הפנייה המקורית שלך:</p>
      <div style="${quoteBox}">${originalMessage || ""}</div>

      <p style="${footer}">FashionSync</p>
    </div>
  `;
}

/**
 * Emails the manager's answer to whoever sent the enquiry.
 *
 * The recipient is whatever address the enquiry carried, which is the only way
 * back to a guest: she has no account, so this is the single channel that can
 * reach her at all.
 *
 * @param {object} options The reply to send.
 * @param {string} options.toEmail Address the enquiry came with.
 * @param {string} options.name Who wrote in.
 * @param {string} options.originalMessage What she asked.
 * @param {string} options.replyText The manager's answer.
 * @return {Promise<object>} The mailer result.
 */
async function sendContactReplyEmail({
  toEmail,
  name,
  originalMessage,
  replyText,
}) {
  if (!toEmail) {
    throw new Error("Recipient email is required");
  }

  if (!replyText) {
    throw new Error("Reply text is required");
  }

  return await sendMail({
    to: toEmail,
    subject: "תשובה לפנייה שלך — FashionSync",
    html: buildContactReplyHtml({name, originalMessage, replyText}),
  });
}

module.exports = {
  sendContactReplyEmail,
};
