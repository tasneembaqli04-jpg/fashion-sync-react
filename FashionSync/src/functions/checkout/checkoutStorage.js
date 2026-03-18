import { safeJsonParse } from "./checkoutHelpers";

export function buildCart() {
  try {
    const pendingCart = JSON.parse(
      localStorage.getItem("fs_pending_cart") || "null"
    );

    if (Array.isArray(pendingCart) && pendingCart.length) {
      return pendingCart;
    }
  } catch {
    // ignore
  }

  const cart = safeJsonParse(localStorage.getItem("fs_cart"), []);
  if (Array.isArray(cart) && cart.length) {
    return cart;
  }

  return [];
}

export function getCurrentUser() {
  return safeJsonParse(localStorage.getItem("fs_current_user"), null);
}

export function getAppliedDiscountPercent() {
  try {
    return Math.round(
      parseFloat(localStorage.getItem("fs_applied_discount") || "0") * 100
    );
  } catch {
    return 0;
  }
}

export function saveReceipt(receipt) {
  const stored = safeJsonParse(localStorage.getItem("fs_receipts"), []);
  stored.push(receipt);
  localStorage.setItem("fs_receipts", JSON.stringify(stored));
}

export function updateProductsStock(cart) {
  try {
    const products = safeJsonParse(localStorage.getItem("fs_products"), []);

    cart.forEach((cartItem) => {
      const product = products.find((p) => p.code === cartItem.code);

      if (product) {
        product.stock = Math.max(
          0,
          Number(product.stock || 0) - Number(cartItem.qty || 0)
        );
      }
    });

    localStorage.setItem("fs_products", JSON.stringify(products));
  } catch {
    // ignore
  }
}

export function clearCheckoutCart() {
  localStorage.removeItem("fs_pending_cart");
  localStorage.removeItem("fs_cart");
}