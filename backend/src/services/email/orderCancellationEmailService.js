const { sendMail } = require("./gmailMailer");
const { isEnglish, dir } = require("./emailLangHelpers");

function buildOrderCancellationEmailHtml({ orderId, total, lang }) {
  const en = isEnglish(lang);

  if (en) {
    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #c9a84c;">Order cancelled</h2>
        <p>Hello,</p>
        <p>Your order <strong>${orderId}</strong> has been cancelled, as requested.</p>
        ${
          total
            ? `<p>If you were charged, an amount of <strong>₪${total}</strong> will be refunded to your original payment method.</p>`
            : ""
        }
        <p>If you didn't request this cancellation, please contact us right away.</p>
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
      </div>
    `;
  }

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">ההזמנה בוטלה</h2>
      <p>שלום,</p>
      <p>ההזמנה שלך <strong>${orderId}</strong> בוטלה, כפי שביקשת.</p>
      ${
        total
          ? `<p>אם חויבת, סכום של <strong>₪${total}</strong> יוחזר לאמצעי התשלום המקורי.</p>`
          : ""
      }
      <p>אם לא ביקשת את הביטול הזה, אנא צרי איתנו קשר בהקדם.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendOrderCancellationEmail({ toEmail, orderId, total, lang }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  if (!orderId) {
    throw new Error("Order id is required");
  }

  const en = isEnglish(lang);
  const subject = en
    ? `Order #${orderId} - Cancelled - FashionSync`
    : `הזמנה #${orderId} - בוטלה - FashionSync`;

  return await sendMail({
    to: toEmail,
    subject,
    html: buildOrderCancellationEmailHtml({ orderId, total, lang }),
  });
}

module.exports = {
  sendOrderCancellationEmail,
};