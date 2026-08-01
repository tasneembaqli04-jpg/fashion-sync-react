const { sendMail } = require("./gmailMailer");
const { isEnglish, dir } = require("./emailLangHelpers");

function buildReturnStatusEmailHtml({ itemName, itemNameEn, status, giftCardCode, giftCardAmount, lang }) {
  const en = isEnglish(lang);
  const approved = status === "approved";
  const name = en ? (itemNameEn || itemName || "the item") : (itemName || "הפריט");

  if (en) {
    const title = approved ? "Your return request was approved! ✅" : "Update on your return request";
    const creditLine =
      approved && giftCardCode
        ? `<p>You received a gift card credit of <strong>₪${giftCardAmount}</strong> with the code: <strong style="letter-spacing:2px;">${giftCardCode}</strong> — you can use it on your next purchase.</p>`
        : "";
    const body = approved
      ? `Your return request for <strong>${name}</strong> has been approved.`
      : `Your return request for <strong>${name}</strong> was not approved this time. If you have any questions, feel free to reach out to us anytime.`;

    return `
      <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #c9a84c;">${title}</h2>
        <p>Hello,</p>
        <p>${body}</p>
        ${creditLine}
        <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
      </div>
    `;
  }

  const title = approved
    ? "בקשת ההחזרה שלך אושרה! ✅"
    : "עדכון לגבי בקשת ההחזרה שלך";

  const creditLine =
    approved && giftCardCode
      ? `<p>לזיכוי בסך <strong>₪${giftCardAmount}</strong> קיבלת כרטיס מתנה עם הקוד: <strong style="letter-spacing:2px;">${giftCardCode}</strong> — אפשר להשתמש בו בקנייה הבאה.</p>`
      : "";

  const body = approved
    ? `בקשת ההחזרה עבור <strong>${name}</strong> אושרה.`
    : `בקשת ההחזרה עבור <strong>${name}</strong> לא אושרה הפעם. אם יש לך שאלות, אפשר לפנות אלינו בכל עת.`;

  return `
    <div dir="${dir(lang)}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #c9a84c;">${title}</h2>
      <p>שלום,</p>
      <p>${body}</p>
      ${creditLine}
      <p style="color: #888; font-size: 0.85em; margin-top: 24px;">FashionSync</p>
    </div>
  `;
}

async function sendReturnStatusEmail({ toEmail, itemName, itemNameEn, status, giftCardCode, giftCardAmount, lang }) {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email is required");
  }

  if (!status) {
    throw new Error("Status is required");
  }

  const en = isEnglish(lang);
  const subject = en
    ? (status === "approved" ? "Your return request was approved - FashionSync" : "Update on your return request - FashionSync")
    : (status === "approved" ? "בקשת ההחזרה שלך אושרה - FashionSync" : "עדכון לגבי בקשת ההחזרה - FashionSync");

  return await sendMail({
    to: toEmail,
    subject,
    html: buildReturnStatusEmailHtml({ itemName, itemNameEn, status, giftCardCode, giftCardAmount, lang }),
  });
}

module.exports = {
  sendReturnStatusEmail,
};