import { saveCartToFirestore } from "../../services/customer/cartFirestore";
import { translateText } from "../../services/translation/translationService";
export function buildGiftCardPreview({ amount, customAmount, name, message }) {
  const previewAmount = amount === "other" ? customAmount || "?" : amount;

  return {
    previewAmount,
    previewName: name || "—",
    previewMessage: message ? `"${message}"` : "",
  };
}

export async function buyGiftCard({ amount, customAmount, name, message, email, cart }) {
  const finalAmount = amount === "other" ? Number(customAmount) : Number(amount);

  if (!name.trim()) {
    return { ok: false, error: "נא להזין שם מקבל." };
  }

  if (!finalAmount || finalAmount < 10) {
    return { ok: false, error: "נא להזין סכום תקין (מינימום ₪10)." };
  }

  if (!email) {
    return { ok: false, error: "יש להתחבר כדי לרכוש כרטיס מתנה." };
  }

  const gcCode = "GC-" + Math.random().toString(36).slice(2, 10).toUpperCase();

  const trimmedRecipient = name.trim();
  const trimmedMessage = message ? message.trim() : "";

  const [giftRecipientEn, giftMessageEn] = await Promise.all([
    translateText(trimmedRecipient),
    trimmedMessage ? translateText(trimmedMessage) : Promise.resolve(""),
  ]);

  const gcItem = {
    code: gcCode,
    key: gcCode,
    name: "כרטיס מתנה FashionSync",
    price: finalAmount,
    qty: 1,
    size: "",
    color: "",
    img: "https://images.pexels.com/photos/5632395/pexels-photo-5632395.jpeg?auto=compress&cs=tinysrgb&w=400",
    isGiftCard: true,
    giftRecipient: trimmedRecipient,
    giftRecipientEn: giftRecipientEn || trimmedRecipient,
    giftMessage: trimmedMessage,
    giftMessageEn: giftMessageEn || trimmedMessage,
  };

  const nextCart = [...(cart || []), gcItem];
  await saveCartToFirestore(email, nextCart);

  return { ok: true, code: gcCode, nextCart };
}