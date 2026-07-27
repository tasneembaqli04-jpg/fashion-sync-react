const { sendMail } = require("./gmailMailer");

function buildPickupScheduledEmailHtml({ orderId, pickupDate, pickupTime }) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">מועד האיסוף נקבע ✅</h2>
      <p>שלום,</p>
      <p>המועד לאיסוף ההזמנה <strong>${orderId || ""}</strong> נקבע ל:</p>
      <p style="font-size: 1.1em; font-weight: bold;">${pickupDate || ""} בשעה ${pickupTime || ""}</p>
      <p>נשמח לראותך בחנות במועד שנבחר.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendPickupScheduledEmail({ toEmail, orderId, pickupDate, pickupTime }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  return await sendMail({
    to: toEmail,
    subject: `מועד האיסוף שלך נקבע - FashionSync`,
    html: buildPickupScheduledEmailHtml({ orderId, pickupDate, pickupTime }),
  });
}

module.exports = {
  sendPickupScheduledEmail,
};