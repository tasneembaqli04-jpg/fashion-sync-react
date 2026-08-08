const { sendMail } = require("./gmailMailer");
const { isEnglish, dir } = require("./emailLangHelpers");

function buildOrderEmailHtml(order, lang) {
  const en = isEnglish(lang);
  const isGiftCardOnly =
    Array.isArray(order.items) &&
    order.items.length > 0 &&
    order.items.every((item) => item.isGiftCard);

  const giftCardCode = isGiftCardOnly
    ? order.items.find((item) => item.isGiftCard)?.code || order.items[0]?.code
    : null;

  const itemsHtml = (order.items || [])
    .map((item) => {
      const name = en && item.nameEn ? item.nameEn : item.name;
      const sizeLabel = item.size ? (en ? ` (size ${item.size})` : ` (מידה ${item.size})`) : "";

      return `<tr>
          <td style="padding:8px 0;">${name}${sizeLabel}</td>
          <td style="padding:8px 0; text-align:center;">${item.qty}</td>
          <td style="padding:8px 0; text-align:${en ? "right" : "left"};">₪${item.price}</td>
        </tr>`;
    })
    .join("");

  if (en) {
    const followUpLine = isGiftCardOnly
      ? "Your gift card is pending approval from our team. We'll send you a separate email with the code once it's activated."
      : order.isPickup
        ? "We'll update you once your order is ready for pickup, and then you can choose a pickup time."
        : "We'll keep you updated at every step of the shipping process.";

    const titleLine = isGiftCardOnly
      ? "Your gift card purchase was received! 🎁"
      : "Your order has been received! 🛍️";

    const codeBlockHtml = "";

    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #c9a84c;">${titleLine}</h2>
        <p>Hello ${order.customerName || ""},</p>
        <p>Your order <strong>${order.id}</strong> was received successfully, and is now awaiting confirmation from our team. We'll send you a separate email once it's confirmed.</p>
        ${codeBlockHtml}

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="border-bottom: 2px solid #c9a84c;">
              <th style="text-align: left; padding: 8px 0;">Item</th>
              <th style="text-align: center; padding: 8px 0;">Qty</th>
              <th style="text-align: right; padding: 8px 0;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <p style="font-size: 1.1em;"><strong>Total to pay: ₪${order.total}</strong></p>
        <p>${followUpLine}</p>
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — thank you for shopping with us</p>
      </div>
    `;
  }

  const followUpLine = isGiftCardOnly
    ? "כרטיס המתנה שלך ממתין לאישור הצוות שלנו. נשלח לך מייל נפרד עם הקוד ברגע שהוא יופעל."
    : order.isPickup
      ? "נעדכן אותך כשההזמנה תהיה מוכנה לאיסוף, ואז תוכל/י לבחור מועד איסוף."
      : "נעדכן אותך בכל שלב במסלול המשלוח.";

  const titleLine = isGiftCardOnly
    ? "רכישת כרטיס המתנה שלך התקבלה! 🎁"
    : "ההזמנה שלך התקבלה! 🛍️";

  const codeBlockHtml = "";

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">${titleLine}</h2>
      <p>שלום ${order.customerName || ""},</p>
      <p>ההזמנה שלך <strong>${order.id}</strong> נקלטה בהצלחה, וממתינה כעת לאישור הצוות שלנו. נעדכן אותך במייל נפרד ברגע שהיא תאושר.</p>
      ${codeBlockHtml}

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
      <p>${followUpLine}</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — תודה שקנית אצלנו</p>
    </div>
  `;
}

async function sendOrderConfirmationEmail({ toEmail, order, lang }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  if (!order || !order.id) {
    throw new Error("Order details are required");
  }

  const subject = isEnglish(lang)
    ? `Order placed #${order.id} - FashionSync`
    : `הזמנה בוצעה #${order.id} - FashionSync`;

  return await sendMail({
    to: toEmail,
    subject,
    html: buildOrderEmailHtml(order, lang),
  });
}

function buildStockAlertEmailHtml(productName, productNameEn, lang) {
  const en = isEnglish(lang);
  const name = en ? (productNameEn || productName || "you requested") : (productName || "שביקשת");

  if (en) {
    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #c9a84c;">The item is back in stock! 🎉</h2>
        <p>Hello,</p>
        <p>The item <strong>${name}</strong> is now available again at FashionSync.</p>
        <p>Order soon before it runs out again!</p>
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — thank you for being part of our community</p>
      </div>
    `;
  }

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">המוצר חזר למלאי! 🎉</h2>
      <p>שלום,</p>
      <p>המוצר <strong>${name}</strong> חזר להיות זמין בחנות FashionSync.</p>
      <p>מהרי להזמין לפני שהוא ייגמר שוב!</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — תודה שאת חלק מהקהילה שלנו</p>
    </div>
  `;
}

async function sendStockAlertEmail({ toEmail, productName, productNameEn, lang }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  const en = isEnglish(lang);
  const displayName = en ? (productNameEn || productName || "Product") : (productName || "מוצר");

  const subject = en
    ? `${displayName} is back in stock! - FashionSync`
    : `${displayName} חזר למלאי! - FashionSync`;

  return await sendMail({
    to: toEmail,
    subject,
    html: buildStockAlertEmailHtml(productName, productNameEn, lang),
  });
}

const STATUS_LABELS = ["אושרה", "בהכנה", "נשלחה", "נמסרה"];
const PICKUP_STATUS_LABELS = ["אושרה", "בהכנה", "מוכן לאיסוף", "נאסף"];
const STATUS_LABELS_EN = ["Confirmed", "Being prepared", "Shipped", "Delivered"];
const PICKUP_STATUS_LABELS_EN = ["Confirmed", "Being prepared", "Ready for pickup", "Picked up"];

function buildShippingUpdateEmailHtml({ orderId, stageIndex, isPickup, lang }) {
  const en = isEnglish(lang);

  if (en) {
    const labels = isPickup ? PICKUP_STATUS_LABELS_EN : STATUS_LABELS_EN;
    const stageName = labels[stageIndex] || "Updated";
    const pickupNote =
      isPickup && stageIndex === 2
        ? `<p>Go to "My Orders" on the site to choose a pickup time.</p>`
        : "";

    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #c9a84c;">Update on your order 📦</h2>
        <p>Hello,</p>
        <p>Order <strong>${orderId}</strong> has been updated to status: <strong>${stageName}</strong>.</p>
        ${pickupNote}
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — thank you for shopping with us</p>
      </div>
    `;
  }

  const labels = isPickup ? PICKUP_STATUS_LABELS : STATUS_LABELS;
  const stageName = labels[stageIndex] || "עודכן";
  const pickupNote =
    isPickup && stageIndex === 2
      ? `<p>היכנסי ל"ההזמנות שלי" באתר כדי לבחור מועד לאיסוף.</p>`
      : "";

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">עדכון להזמנה שלך 📦</h2>
      <p>שלום,</p>
      <p>ההזמנה <strong>${orderId}</strong> עודכנה לסטטוס: <strong>${stageName}</strong>.</p>
      ${pickupNote}
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — תודה שקנית אצלנו</p>
    </div>
  `;
}

async function sendShippingUpdateEmail({ toEmail, orderId, stageIndex, isPickup, lang }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  if (!orderId) {
    throw new Error("Order id is required");
  }

  const en = isEnglish(lang);
  const labels = isPickup
    ? (en ? PICKUP_STATUS_LABELS_EN : PICKUP_STATUS_LABELS)
    : (en ? STATUS_LABELS_EN : STATUS_LABELS);
  const stageName = labels[stageIndex] || (en ? "Updated" : "עודכן");

  const subject = en
    ? `Order #${orderId} - ${stageName} - FashionSync`
    : `הזמנה #${orderId} - ${stageName} - FashionSync`;

  return await sendMail({
    to: toEmail,
    subject,
    html: buildShippingUpdateEmailHtml({ orderId, stageIndex, isPickup, lang }),
  });
}

function buildGiftCardActivatedEmailHtml({ giftCardCode, amount, lang }) {
  const en = isEnglish(lang);

  if (en) {
    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #c9a84c;">Your gift card is ready! 🎁</h2>
        <p>Great news — your gift card purchase has been approved and is now active.</p>
        <p style="font-size: 1.2em; text-align: center; background: #faf6ea; border: 1px dashed #c9a84c; border-radius: 8px; padding: 12px; margin: 16px 0;">
          <strong>Gift card code:</strong><br />
          <span style="letter-spacing: 2px; font-size: 1.3em; color: #c9a84c;">${giftCardCode}</span><br />
          <span>Value: ₪${amount}</span>
        </p>
        <p>The code is ready to use now, at checkout or in the gift card balance check page.</p>
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — thank you for shopping with us</p>
      </div>
    `;
  }

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">כרטיס המתנה שלך מוכן! 🎁</h2>
      <p>חדשות טובות — רכישת כרטיס המתנה שלך אושרה והכרטיס פעיל עכשיו.</p>
      <p style="font-size: 1.2em; text-align: center; background: #faf6ea; border: 1px dashed #c9a84c; border-radius: 8px; padding: 12px; margin: 16px 0;">
        <strong>קוד כרטיס המתנה:</strong><br />
        <span style="letter-spacing: 2px; font-size: 1.3em; color: #c9a84c;">${giftCardCode}</span><br />
        <span>שווי: ₪${amount}</span>
      </p>
      <p>הקוד מוכן לשימוש עכשיו, בקופה או בדף בדיקת יתרת כרטיס מתנה.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync — תודה שקנית אצלנו</p>
    </div>
  `;
}

async function sendGiftCardActivatedEmail({ toEmail, giftCardCode, amount, lang }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  if (!giftCardCode) {
    throw new Error("Gift card code is required");
  }

  const en = isEnglish(lang);
  const subject = en
    ? `Your gift card is ready - FashionSync`
    : `כרטיס המתנה שלך מוכן - FashionSync`;

  return await sendMail({
    to: toEmail,
    subject,
    html: buildGiftCardActivatedEmailHtml({ giftCardCode, amount, lang }),
  });
}

function buildOrderRejectedEmailHtml({ orderId, reason, lang }) {
  const en = isEnglish(lang);

  if (en) {
    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #e74c3c;">Order update</h2>
        <p>Hello,</p>
        <p>Unfortunately, order <strong>${orderId}</strong> could not be processed and has been declined.</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ""}
        <p>If you were charged, the amount will be refunded. For questions, please contact us.</p>
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
      </div>
    `;
  }

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #e74c3c;">עדכון לגבי ההזמנה שלך</h2>
      <p>שלום,</p>
      <p>לצערנו, ההזמנה <strong>${orderId}</strong> לא הצלחנו לטפל בה ונדחתה.</p>
      ${reason ? `<p>סיבה: ${reason}</p>` : ""}
      <p>אם חויבת, הסכום יוחזר. לשאלות, אנא צרי איתנו קשר.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendOrderRejectedEmail({ toEmail, orderId, reason, lang }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  if (!orderId) {
    throw new Error("Order id is required");
  }

  const en = isEnglish(lang);
  const subject = en
    ? `Order #${orderId} - Declined - FashionSync`
    : `הזמנה #${orderId} - נדחתה - FashionSync`;

  return await sendMail({
    to: toEmail,
    subject,
    html: buildOrderRejectedEmailHtml({ orderId, reason, lang }),
  });
}

function buildGiftCardRejectedEmailHtml({ lang }) {
  const en = isEnglish(lang);

  if (en) {
    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #e74c3c;">Gift card update</h2>
        <p>Hello,</p>
        <p>Unfortunately, your gift card purchase could not be approved and has been declined.</p>
        <p>If you were charged, the amount will be refunded. For questions, please contact us.</p>
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
      </div>
    `;
  }

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #e74c3c;">עדכון לגבי כרטיס המתנה שלך</h2>
      <p>שלום,</p>
      <p>לצערנו, רכישת כרטיס המתנה לא אושרה ונדחתה.</p>
      <p>אם חויבת, הסכום יוחזר. לשאלות, אנא צרי איתנו קשר.</p>
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendGiftCardRejectedEmail({ toEmail, lang }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  const en = isEnglish(lang);
  const subject = en
    ? `Your gift card request was declined - FashionSync`
    : `בקשת כרטיס המתנה שלך נדחתה - FashionSync`;

  return await sendMail({
    to: toEmail,
    subject,
    html: buildGiftCardRejectedEmailHtml({ lang }),
  });
}

module.exports = {
  sendOrderConfirmationEmail,
  sendStockAlertEmail,
  sendShippingUpdateEmail,
  sendGiftCardActivatedEmail,
  sendOrderRejectedEmail,
  sendGiftCardRejectedEmail,
};