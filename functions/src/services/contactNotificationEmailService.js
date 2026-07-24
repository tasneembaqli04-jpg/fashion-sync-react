const { sendMail } = require("./gmailMailer");

function buildContactNotificationHtml({ name, email, message }) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">הודעת יצירת קשר חדשה מהאתר 📩</h2>
      <p><strong>שם:</strong> ${name || "לא צוין"}</p>
      <p><strong>מייל חוזר:</strong> ${email || "לא צוין"}</p>
      <p><strong>הודעה:</strong></p>
      <div style="background:#f5f0e8; border-radius:10px; padding:14px;">${message || ""}</div>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — התקבל דרך עמוד המדיניות באתר</p>
    </div>
  `;
}

async function sendContactNotificationEmail({ name, email, message }) {
  if (!message) {
    throw new Error("Message is required");
  }

  return await sendMail({
    to: process.env.GMAIL_USER,
    subject: `הודעה חדשה מהאתר מ-${name || "לקוח/ה"}`,
    html: buildContactNotificationHtml({ name, email, message }),
  });
}

module.exports = {
  sendContactNotificationEmail,
};