import { addOrder } from "../../services/orders/ordersService";
import { clearCartFromFirestore } from "../../services/customer/cartFirestore";
import { getCurrentUser, LS_KEYS } from "./checkoutStorage";

export async function saveReceiptAndOrder(receipt) {
  if (!receipt || typeof receipt !== "object") {
    throw new Error("Receipt is invalid");
  }

  await addOrder(receipt);
  return receipt;
}

/**
 * Clears everything the finished basket left behind.
 *
 * Every key here belongs to a basket that has become an order, so all of them
 * go together.
 *
 * The gift card pair is deliberately absent: LS_KEYS has no GIFT_CARD_CODE or
 * GIFT_CARD_DISCOUNT, so every use of them reads and writes a key literally
 * named "undefined", and nothing ever writes it. Clearing them here would
 * remove that key and look like it did something.
 *
 * The local keys are cleared before the Firestore cart, and the Firestore call
 * has its own catch: it is the only part that can fail, and a network error
 * there must not leave a coupon and a points redemption sitting in the
 * browser to be spent a second time.
 *
 * @param {string} [emailOverride] - Account whose stored cart to clear.
 * @returns {Promise<void>}
 */
export async function clearCheckoutCart(emailOverride) {
  const email = emailOverride || getCurrentUser()?.email;

  localStorage.removeItem(LS_KEYS.PENDING_CART);
  localStorage.removeItem(LS_KEYS.CART);
  localStorage.removeItem(LS_KEYS.DISCOUNT);
  localStorage.removeItem(LS_KEYS.COUPON_CODE);
  localStorage.removeItem(LS_KEYS.POINTS_REDEEMED);

  if (!email) {
    return;
  }

  try {
    await clearCartFromFirestore(email);
  } catch (err) {
    console.error(`Cart not cleared in Firestore: ${err.message}`);
  }
}