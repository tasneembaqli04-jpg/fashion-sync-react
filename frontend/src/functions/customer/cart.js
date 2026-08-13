import { LS_KEYS } from "../../data/constants";
import {
  saveCartToFirestore,
  getCartFromFirestore,
  clearCartFromFirestore,
} from "../../services/customer/cartFirestore";

export async function loadCartFromBackend(email) {
  return await getCartFromFirestore(email);
}

/**
 * Returns the initial cart state: always empty.
 *
 * The cart lives in Firestore, not in the browser, so the page starts empty
 * and is filled by loadCartFromBackend once the user is known. Returning []
 * synchronously lets useState initialise without waiting for the network.
 *
 * @returns {Array} An empty cart.
 */
export function loadCart() {
  return [];
}

export function getCartCount(cart) {
  return cart.reduce((sum, item) => sum + (item.qty || 0), 0);
}

/**
 * Calculates the cart totals shown in the cart drawer.
 *
 * IMPORTANT — appliedDiscount here is a fraction (0.1 for 10%), not a
 * percentage. This is the value stored on the coupon document, which the
 * manager UI writes as discountPct / 100. The checkout screen uses a separate
 * implementation (getDiscountAmount in checkoutPricing.js) that expects a
 * percentage instead, and normalises the coupon value on the way in. Passing
 * a percentage here would produce a 100x discount and a zero total.
 *
 * Both the coupon and the points discount are clamped so the total can never
 * go below zero.
 *
 * @param {Array<{price: number, qty: number}>} cart - Cart items.
 * @param {number} [appliedDiscount=0] - Coupon discount as a fraction (0.1 = 10%).
 * @param {number} [pointsDiscountAmount=0] - Fixed shekel amount from redeemed loyalty points.
 * @returns {{raw: number, discount: number, total: number}} Subtotal, discount amount and final total.
 */
export function getCartTotals(cart, appliedDiscount = 0, pointsDiscountAmount = 0) {
  const raw = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = Math.round(raw * appliedDiscount);
  const afterCoupon = Math.max(0, raw - discount);
  const total = Math.max(0, afterCoupon - (Number(pointsDiscountAmount) || 0));
  return { raw, discount, total };
}

/**
 * Adds a product variant to the cart and persists the result to Firestore.
 *
 * Items are identified by a composite key of code|size|color rather than by
 * product code, so the same product in two colours or sizes occupies two
 * separate cart lines. Adding an item that already exists increments its
 * quantity instead, capped at the available stock.
 *
 * Both the Hebrew and English name and colour are stored on the item at this
 * point. The order document keeps a copy of the item as it was when bought,
 * so it can be displayed in either language later even if the catalogue
 * changes. colorEn is read from the matching variant.
 *
 * @param {object} options
 * @param {string} options.email - Customer email, used as the Firestore cart key.
 * @param {Array} options.cart - Current cart.
 * @param {object} options.product - Product being added.
 * @param {{size?: string, color?: string, isCustomSize?: boolean}} [options.variant] - Selected variant.
 * @returns {Promise<Array>} The updated cart.
 */
export async function addToCart({
  email,
  cart,
  product,
  variant = { size: "", color: "" },
}) {
  const key = `${product.code}|${variant.size || ""}|${variant.color || ""}`;

  const existingItem = cart.find((item) => item.key === key);

  let nextCart;

  if (existingItem) {
    nextCart = cart.map((item) =>
      item.key !== key
        ? item
        : {
            ...item,
            qty: Math.min(item.qty + 1, product.stock),
          }
    );
  } else {
    const matchingVariant = product.variants?.find(
      (v) => v.colorName === variant.color
    );

    nextCart = [
      ...cart,
      {
        key,
        code: product.code,
        name: product.name,
        nameEn: product.nameEn || product.name,
        img: product.img,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        sale: product.sale || false,
        qty: 1,
        size: variant.size || "",
        color: variant.color || "",
        colorEn: matchingVariant?.colorNameEn || variant.color || "",
        isCustomSize: Boolean(variant.isCustomSize),
      },
    ];
  }

  await saveCartToFirestore(email, nextCart);
  return nextCart;
}

/**
 * Changes the quantity of a cart line by a delta, and persists the result.
 *
 * Two edge cases are handled here rather than by the caller: reaching zero or
 * below removes the line entirely, and the quantity is capped at the product's
 * current stock so the cart cannot exceed what is available. When the product
 * is no longer in the catalogue the cap falls back to 99, so an item that was
 * removed from the store does not become unchangeable.
 *
 * @param {Array} cart - Current cart.
 * @param {string} key - Composite key of the line to change (code|size|color).
 * @param {number} delta - Amount to add, may be negative.
 * @param {Array} products - Live catalogue, used for the stock cap.
 * @param {string} email - Customer email, used as the Firestore cart key.
 * @returns {Promise<Array>} The updated cart.
 */
export async function changeQty(cart, key, delta, products, email) {
  const currentItem = cart.find((item) => item.key === key);
  if (!currentItem) return cart;

  const product = products.find((p) => p.code === currentItem.code);
  const maxStock = product ? product.stock : 99;
  const nextQty = currentItem.qty + delta;

  let nextCart;

  if (nextQty <= 0) {
    nextCart = cart.filter((item) => item.key !== key);
  } else {
    nextCart = cart.map((item) =>
      item.key === key
        ? { ...item, qty: Math.min(nextQty, maxStock) }
        : item
    );
  }

  await saveCartToFirestore(email, nextCart);
  return nextCart;
}

export async function removeItem(cart, key, email) {
  const nextCart = cart.filter((item) => item.key !== key);
  await saveCartToFirestore(email, nextCart);
  return nextCart;
}