const {sendMail} = require("./gmailMailer");
const {isEnglish, dir} = require("./emailLangHelpers");

function buildPickupScheduledEmailHtml({orderId, pickupDate, pickupTime, lang}) {
  const en = isEnglish(lang);

  if (en) {
    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #c9a84c;">Your pickup time is set ✅</h2>
        <p>Hello,</p>
        <p>The pickup time for order <strong>${orderId || ""}</strong> has been set to:</p>
        <p style="font-size: 1.1em; font-weight: bold;">${pickupDate || ""} at ${pickupTime || ""}</p>
        <p>We look forward to seeing you at the store at the chosen time.</p>
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
      </div>
    `;
  }

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">מועד האיסוף נקבע ✅</h2>
      <p>שלום,</p>
      <p>המועד לאיסוף ההזמנה <strong>${orderId || ""}</strong> נקבע ל:</p>
      <p style="font-size: 1.1em; font-weight: bold;">${pickupDate || ""} בשעה ${pickupTime || ""}</p>
      <p>נשמח לראותך בחנות במועד שנבחר.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendPickupScheduledEmail({toEmail, orderId, pickupDate, pickupTime, lang}) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  const subject = isEnglish(lang) ?
    "Your pickup time is set - FashionSync" :
    "מועד האיסוף שלך נקבע - FashionSync";

  return await sendMail({
    to: toEmail,
    subject,
    html: buildPickupScheduledEmailHtml({orderId, pickupDate, pickupTime, lang}),
  });
}

module.exports = {
  sendPickupScheduledEmail,
};
