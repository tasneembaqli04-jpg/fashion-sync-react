import { addOrder } from "../../backend/services/orders/ordersService";
import { clearCartFromFirestore } from "../../backend/services/customer/cartFirestore";
import { getCurrentUser, LS_KEYS } from "./checkoutStorage";

export async function saveReceiptAndOrder(receipt) {
  if (!receipt || typeof receipt !== "object") {
    throw new Error("Receipt is invalid");
  }

  await addOrder(receipt);
  return receipt;
}

export async function clearCheckoutCart() {
  const email = getCurrentUser()?.email;

  localStorage.removeItem(LS_KEYS.PENDING_CART);
  localStorage.removeItem(LS_KEYS.CART);
  localStorage.removeItem(LS_KEYS.DISCOUNT);

  if (email) {
    await clearCartFromFirestore(email);
  }
}