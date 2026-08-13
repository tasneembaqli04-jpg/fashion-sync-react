const {sendMail} = require("./gmailMailer");
const {isEnglish, dir} = require("./emailLangHelpers");

function buildVerificationEmailHtml(code, lang) {
  const en = isEnglish(lang);

  if (en) {
    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #c9a84c;">Your verification code 🔐</h2>
        <p>Hello,</p>
        <p>To complete your registration at FashionSync, please enter the following code on the site:</p>
        <div style="background: #f5f0e8; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
          <span style="font-size: 2rem; font-weight: 900; letter-spacing: 6px; color: #1a1a1a;">${code}</span>
        </div>
        <p>The code is valid for one minute. If you didn't request this code, you can ignore this email.</p>
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
      </div>
    `;
  }

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">קוד האימות שלך 🔐</h2>
      <p>שלום,</p>
      <p>כדי להשלים את ההרשמה ל-FashionSync, יש להזין את הקוד הבא באתר:</p>
      <div style="background: #f5f0e8; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
        <span style="font-size: 2rem; font-weight: 900; letter-spacing: 6px; color: #1a1a1a;">${code}</span>
      </div>
      <p>הקוד תקף לדקה אחת. אם לא ביקשת קוד זה, אפשר להתעלם מהמייל הזה.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendVerificationCodeEmail({toEmail, code, lang}) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  if (!code) {
    throw new Error("Verification code is required");
  }

  const subject = isEnglish(lang) ?
    `${code} is your verification code - FashionSync` :
    `${code} הוא קוד האימות שלך - FashionSync`;

  return await sendMail({
    to: toEmail,
    subject,
    html: buildVerificationEmailHtml(code, lang),
  });
}

function buildWelcomeEmailHtml(name, lang) {
  const en = isEnglish(lang);

  if (en) {
    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #c9a84c;">Welcome to FashionSync! ✨</h2>
        <p>Hello ${name || ""},</p>
        <p>Your account has been successfully verified, and your registration is complete! You can now browse the catalog, earn loyalty points, and track your orders in your personal area.</p>
        <p>We're glad you joined us 🎉</p>
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
      </div>
    `;
  }

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">ברוכה הבאה ל-FashionSync! ✨</h2>
      <p>שלום ${name || ""},</p>
      <p>החשבון שלך אומת בהצלחה, וההרשמה הושלמה! עכשיו אפשר לגלוש בקטלוג, לצבור נקודות נאמנות, ולעקוב אחרי ההזמנות שלך באזור האישי.</p>
      <p>שמחים שהצטרפת אלינו 🎉</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendWelcomeEmail({toEmail, name, lang}) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  const subject = isEnglish(lang) ?
    "Welcome to FashionSync! 🎉" :
    "ברוכה הבאה ל-FashionSync! 🎉";

  return await sendMail({
    to: toEmail,
    subject,
    html: buildWelcomeEmailHtml(name, lang),
  });
}

module.exports = {
  sendVerificationCodeEmail,
  sendWelcomeEmail,
};
