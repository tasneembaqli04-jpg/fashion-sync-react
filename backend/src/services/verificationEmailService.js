const { sendMail } = require("./gmailMailer");

function buildVerificationEmailHtml(code) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">קוד האימות שלך 🔐</h2>
      <p>שלום,</p>
      <p>כדי להשלים את ההרשמה ל-FashionSync, יש להזין את הקוד הבא באתר:</p>
      <div style="background: #f5f0e8; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
        <span style="font-size: 2rem; font-weight: 900; letter-spacing: 6px; color: #1a1a1a;">${code}</span>
      </div>
      <p>הקוד תקף ל-10 דקות. אם לא ביקשת קוד זה, אפשר להתעלם מהמייל הזה.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendVerificationCodeEmail({ toEmail, code }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  if (!code) {
    throw new Error("Verification code is required");
  }

  return await sendMail({
    to: toEmail,
    subject: `${code} הוא קוד האימות שלך - FashionSync`,
    html: buildVerificationEmailHtml(code),
  });
}

function buildWelcomeEmailHtml(name) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">ברוכה הבאה ל-FashionSync! ✨</h2>
      <p>שלום ${name || ""},</p>
      <p>החשבון שלך אומת בהצלחה, וההרשמה הושלמה! עכשיו אפשר לגלוש בקטלוג, לצבור נקודות נאמנות, ולעקוב אחרי ההזמנות שלך באזור האישי.</p>
      <p>שמחים שהצטרפת אלינו 🎉</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendWelcomeEmail({ toEmail, name }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  return await sendMail({
    to: toEmail,
    subject: "ברוכה הבאה ל-FashionSync! 🎉",
    html: buildWelcomeEmailHtml(name),
  });
}

module.exports = {
  sendVerificationCodeEmail,
  sendWelcomeEmail,
};