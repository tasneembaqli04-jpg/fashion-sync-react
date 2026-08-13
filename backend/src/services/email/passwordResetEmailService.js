const admin = require("firebase-admin");
const {sendMail} = require("./gmailMailer");

if (!admin.apps.length) {
  admin.initializeApp();
}

function buildPasswordResetEmailHtml(resetLink) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
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

async function sendPasswordResetEmail({toEmail}) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  const resetLink = await admin.auth().generatePasswordResetLink(toEmail);

  return await sendMail({
    to: toEmail,
    subject: "איפוס סיסמה - FashionSync",
    html: buildPasswordResetEmailHtml(resetLink),
  });
}

module.exports = {
  sendPasswordResetEmail,
};
