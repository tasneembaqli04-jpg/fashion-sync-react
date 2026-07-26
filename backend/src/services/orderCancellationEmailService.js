const { sendMail } = require("./gmailMailer");

function buildOrderCancellationEmailHtml({ orderId, total }) {
  const amountLine =
    total !== undefined && total !== null
      ? `<p>סכום ההזמנה, בסך <strong>₪${total}</strong>, יוחזר אליך.</p>`
      : "";

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">ההזמנה שלך בוטלה</h2>
      <p>שלום,</p>
      <p>הזמנה מספר <strong>${orderId || ""}</strong> בוטלה בהצלחה, לבקשתך.</p>
      ${amountLine}
      <p style="color: #888; font-size: 0.9em;">שימי לב: זו הודעה בלבד — במידה ובוצע תשלום בפועל, הצוות שלנו יטפל בהחזר בהתאם.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendOrderCancellationEmail({ toEmail, orderId, total }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  return await sendMail({
    to: toEmail,
    subject: "ההזמנה שלך בוטלה - FashionSync",
    html: buildOrderCancellationEmailHtml({ orderId, total }),
  });
}

module.exports = {
  sendOrderCancellationEmail,
};