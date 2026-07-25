const { sendMail } = require("./gmailMailer");

function buildReturnStatusEmailHtml({ itemName, status, giftCardCode, giftCardAmount }) {
  const approved = status === "approved";

  const title = approved
    ? "בקשת ההחזרה שלך אושרה! ✅"
    : "עדכון לגבי בקשת ההחזרה שלך";

  const creditLine =
    approved && giftCardCode
      ? `<p>לזיכוי בסך <strong>₪${giftCardAmount}</strong> קיבלת כרטיס מתנה עם הקוד: <strong style="letter-spacing:2px;">${giftCardCode}</strong> — אפשר להשתמש בו בקנייה הבאה.</p>`
      : "";

  const body = approved
    ? `בקשת ההחזרה עבור <strong>${itemName || "הפריט"}</strong> אושרה.`
    : `בקשת ההחזרה עבור <strong>${itemName || "הפריט"}</strong> לא אושרה הפעם. אם יש לך שאלות, אפשר לפנות אלינו בכל עת.`;

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">${title}</h2>
      <p>שלום,</p>
      <p>${body}</p>
      ${creditLine}
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendReturnStatusEmail({ toEmail, itemName, status, giftCardCode, giftCardAmount }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  if (!status) {
    throw new Error("Status is required");
  }

  return await sendMail({
    to: toEmail,
    subject:
      status === "approved"
        ? "בקשת ההחזרה שלך אושרה - FashionSync"
        : "עדכון לגבי בקשת ההחזרה - FashionSync",
    html: buildReturnStatusEmailHtml({ itemName, status, giftCardCode, giftCardAmount }),
  });
}

module.exports = {
  sendReturnStatusEmail,
};