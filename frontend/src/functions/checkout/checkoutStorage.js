
export const LS_KEYS = {
  CURRENT_USER: "fs_current_user",
  CART: "fs_cart",
  PENDING_CART: "fs_pending_cart",
  RECEIPTS: "fs_receipts",
  PRODUCTS: "fs_products",
  DISCOUNT: "fs_applied_discount",
  COUPON_CODE: "fs_applied_coupon_code",
  POINTS_REDEEMED: "fs_points_redeemed",
  ORDERS_PREFIX: "fs_orders_",
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

export function buildCart() {
  const pendingCart = safeParse(localStorage.getItem(LS_KEYS.PENDING_CART), null);
  if (Array.isArray(pendingCart) && pendingCart.length > 0) {
    return pendingCart;
  }

  const cart = safeParse(localStorage.getItem(LS_KEYS.CART), []);
  if (Array.isArray(cart)) {
    return cart;
  }

  return [];
}

