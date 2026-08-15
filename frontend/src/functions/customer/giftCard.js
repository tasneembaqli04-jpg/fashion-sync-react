import { saveCartToFirestore } from "../../services/customer/cartFirestore";
import { translateText, keepPersonName } from "../../services/translation/translationService";
export function buildGiftCardPreview({ amount, customAmount, name, message }) {
  const previewAmount = amount === "other" ? customAmount || "?" : amount;

  return {
    previewAmount,
    previewName: name || "—",
    previewMessage: message ? `"${message}"` : "",
  };
}

/**
 * Validates a gift card purchase and adds it to the cart as a regular item.
 *
 * A gift card is not created in Firestore here. It is added to the cart as an
 * item flagged with isGiftCard, and the giftCards document is only written
 * during checkout (issueGiftCard, called from addOrder) once the purchase is
 * actually completed. This avoids leaving orphaned cards behind when a
 * customer abandons the cart.
 *
 * The flag also changes checkout behaviour downstream: gift card items are
 * skipped by stock decrementing, earn no loyalty points, and require no
 * shipping.
 *
 * The code is generated client-side from Math.random, which is fine for
 * uniqueness at this scale but is not unguessable — the card is only usable
 * once its status is set to active by the manager.
 *
 * @param {object} options
 * @param {string|number} options.amount - Selected preset amount, or "other".
 * @param {string|number} options.customAmount - Amount used when "other" is selected.
 * @param {string} options.name - Recipient name. Required.
 * @param {string} options.message - Optional greeting message.
 * @param {string} options.email - Buyer email. Required, so the cart can be saved.
 * @param {Array} options.cart - Current cart.
 * @returns {Promise<{ok: boolean, error?: string, code?: string, nextCart?: Array}>}
 * Failure carries a reason code rather than a sentence, because this layer has
 * no access to the chosen language. The page maps the code to wording.
 */
export async function buyGiftCard({ amount, customAmount, name, message, email, cart }) {
  const finalAmount = amount === "other" ? Number(customAmount) : Number(amount);

  if (!name.trim()) {
    return { ok: false, reason: "recipientRequired" };
  }

  if (!finalAmount || finalAmount < 10) {
    return { ok: false, reason: "invalidAmount" };
  }

  if (!email) {
    return { ok: false, reason: "loginRequired" };
  }

  const gcCode = "GC-" + Math.random().toString(36).slice(2, 10).toUpperCase();

  const trimmedRecipient = name.trim();
  const trimmedMessage = message ? message.trim() : "";

  // The recipient is a person; only the free-text message is translated.
  const giftRecipientEn = keepPersonName(trimmedRecipient);
  const giftMessageEn = trimmedMessage ? await translateText(trimmedMessage) : "";

  const gcItem = {
    code: gcCode,
    key: gcCode,
    name: "כרטיס מתנה FashionSync",
    nameEn: "FashionSync Gift Card",
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