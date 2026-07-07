import { addOrder } from "../orders/ordersService";
import { clearCartFromFirestore } from "../customer/cartFirestore";
import { decrementProductsStock } from "../productsService";
const LS_KEYS = {
  CURRENT_USER: "fs_current_user",
  DISCOUNT: "fs_applied_discount",
};

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}




export function getCurrentUser() {
  const user = safeParse(localStorage.getItem(LS_KEYS.CURRENT_USER), null);
  return user && typeof user === "object" ? user : null;
}

export function getAppliedDiscountPercent() {
  const raw = localStorage.getItem(LS_KEYS.DISCOUNT);

  if (raw === null || raw === undefined || raw === "") {
    return 0;
  }

  const value = Number(raw);

  if (Number.isNaN(value)) {
    return 0;
  }

  if (value > 0 && value < 1) {
    return Math.round(value * 100);
  }

  if (value >= 1 && value <= 100) {
    return value;
  }

  return 0;
}


export async function saveReceiptAndOrder(receipt) {
  if (!receipt || typeof receipt !== "object") {
    throw new Error("Receipt is invalid");
  }

  await addOrder(receipt);
  return receipt;
}

export async function updateProductsStock(cartItems = []) {
  if (!Array.isArray(cartItems)) {
    throw new Error("Cart items must be an array");
  }

  await decrementProductsStock(cartItems);
  return [];
}

export async function clearCheckoutCart() {
  const email = getCurrentUser()?.email;

  localStorage.removeItem(LS_KEYS.DISCOUNT);

  if (email) {
    await clearCartFromFirestore(email);
  }
}