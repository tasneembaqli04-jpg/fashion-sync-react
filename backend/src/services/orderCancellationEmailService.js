const admin = require("firebase-admin");
const { sendMail } = require("./gmailMailer");
const { isEnglish, dir } = require("./emailLangHelpers");

if (!admin.apps.length) {
  admin.initializeApp();
}

function buildPasswordResetEmailHtml(resetLink, lang) {
  const en = isEnglish(lang);

  if (en) {
    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #c9a84c;">Password reset 🔑</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your FashionSync account. If this was you, click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}" style="background: linear-gradient(135deg,#c9a84c,#e8c97a); color:#080808; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 900; display: inline-block;">
            Reset password
          </a>
        </div>
        <p style="color: #888; font-size: 0.85em;">If you didn't request a password reset, you can safely ignore this email — your password will not change.</p>
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
      </div>
    `;
  }

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">איפוס סיסמה 🔑</h2>
      <p>שלום,</p>
      <p>קיבלנו בקשה לאיפוס הסיסמה לחשבון שלך ב-FashionSync. אם זו את, לחצי על הכפתור למטה כדי לבחור סיסמה חדשה:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetLink}" style="background: linear-gradient(135deg,#c9a84c,#e8c97a); color:#080808; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 900; display: inline-block;">
          איפוס סיסמה
        </a>
      </div>
      <p style="color: #888; font-size: 0.85em;">אם לא ביקשת איפוס סיסמה, אפשר להתעלם מהמייל הזה בבטחה — הסיסמה שלך לא תשתנה.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendPasswordResetEmail({ toEmail, lang }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  const resetLink = await admin.auth().generatePasswordResetLink(toEmail);

  const subject = isEnglish(lang)
    ? "Password reset - FashionSync"
    : "איפוס סיסמה - FashionSync";

  return await sendMail({
    to: toEmail,
    subject,
    html: buildPasswordResetEmailHtml(resetLink, lang),
  });
}

module.exports = {
  sendPasswordResetEmail,
};