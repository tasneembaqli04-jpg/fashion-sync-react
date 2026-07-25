const { sendMail } = require("./gmailMailer");

function buildOrderEmailHtml(order) {
  const itemsHtml = (order.items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;">${item.name} ${
          item.size ? `(מידה ${item.size})` : ""
        }</td>
          <td style="padding:8px 0; text-align:center;">${item.qty}</td>
          <td style="padding:8px 0; text-align:left;">₪${item.price}</td>
        </tr>`
    )
    .join("");

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">ההזמנה שלך התקבלה! 🛍️</h2>
      <p>שלום ${order.customerName || ""},</p>
      <p>ההזמנה שלך <strong>${order.id}</strong> נקלטה בהצלחה, וממתינה כעת לאישור הצוות שלנו. נעדכן אותך במייל נפרד ברגע שהיא תאושר.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="border-bottom: 2px solid #c9a84c;">
            <th style="text-align: right; padding: 8px 0;">פריט</th>
            <th style="text-align: center; padding: 8px 0;">כמות</th>
            <th style="text-align: left; padding: 8px 0;">מחיר</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <p style="font-size: 1.1em;"><strong>סה"כ לתשלום: ₪${order.total}</strong></p>
      <p>נעדכן אותך בכל שלב במסלול המשלוח.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — תודה שקנית אצלנו</p>
    </div>
  `;
}

async function sendOrderConfirmationEmail({ toEmail, order }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  if (!order || !order.id) {
    throw new Error("Order details are required");
  }

  return await sendMail({
    to: toEmail,
    subject: `הזמנה בוצעה #${order.id} - FashionSync`,
    html: buildOrderEmailHtml(order),
  });
}

function buildStockAlertEmailHtml(productName) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">המוצר חזר למלאי! 🎉</h2>
      <p>שלום,</p>
      <p>המוצר <strong>${productName || "שביקשת"}</strong> חזר להיות זמין בחנות FashionSync.</p>
      <p>מהרי להזמין לפני שהוא ייגמר שוב!</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — תודה שאת חלק מהקהילה שלנו</p>
    </div>
  `;
}

async function sendStockAlertEmail({ toEmail, productName }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  return await sendMail({
    to: toEmail,
    subject: `${productName || "מוצר"} חזר למלאי! - FashionSync`,
    html: buildStockAlertEmailHtml(productName),
  });
}

const STATUS_LABELS = ["אושרה", "בהכנה", "נשלחה", "נמסרה"];

function buildShippingUpdateEmailHtml({ orderId, stageIndex }) {
  const stageName = STATUS_LABELS[stageIndex] || "עודכן";

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">עדכון להזמנה שלך 📦</h2>
      <p>שלום,</p>
      <p>ההזמנה <strong>${orderId}</strong> עודכנה לסטטוס: <strong>${stageName}</strong>.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — תודה שקנית אצלנו</p>
    </div>
  `;
}

async function sendShippingUpdateEmail({ toEmail, orderId, stageIndex }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  if (!orderId) {
    throw new Error("Order id is required");
  }

  const stageName = STATUS_LABELS[stageIndex] || "עודכן";

  return await sendMail({
    to: toEmail,
    subject: `הזמנה #${orderId} - ${stageName} - FashionSync`,
    html: buildShippingUpdateEmailHtml({ orderId, stageIndex }),
  });
}

module.exports = {
  sendOrderConfirmationEmail,
  sendStockAlertEmail,
  sendShippingUpdateEmail,
};