/**
 * Calculates the cart subtotal, before discounts or shipping.
 *
 * @param {Array<{price?: number, qty?: number}>} [cart=[]] - Cart items, each with a price and quantity.
 * @returns {number} Sum of (price × qty) across all items. Missing price/qty count as 0.
 */
export function getSubtotal(cart = []) {
  return cart.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.qty || 0);
  }, 0);
}

/**
 * Calculates the discount amount from a coupon or a percentage promotion.
 *
 * @param {number} [subtotal=0] - Cart subtotal before the discount.
 * @param {number} [discountPct=0] - Discount percentage (for example 10 for 10% off).
 * @returns {number} Discount amount in shekels, rounded to the nearest whole number.
 */
export function getDiscountAmount(subtotal = 0, discountPct = 0) {
  return Math.round(subtotal * (Number(discountPct || 0) / 100));
}

/**
 * Determines the shipping cost for the selected shipping method.
 *
 * Standard shipping is free once the subtotal reaches ₪200. Every other
 * method (express, same day, pickup) always charges its listed price,
 * regardless of the subtotal.
 *
 * @param {{id?: string, price?: number}|null} selectedShipping - Selected shipping method, or null if none.
 * @param {number} [subtotal=0] - Cart subtotal, used for the free-shipping threshold.
 * @returns {number} Shipping cost. 0 when no shipping method is selected.
 */
export function getShippingCost(selectedShipping, subtotal = 0) {
  if (!selectedShipping) return 0;

  if (selectedShipping.id === "standard" && subtotal >= 200) {
    return 0;
  }

  return Number(selectedShipping.price || 0);
}

/**
 * Calculates the final order total: subtotal, minus the percentage discount
 * and the loyalty points discount, plus shipping. The amount before shipping
 * is never negative (clamped at 0).
 *
 * @param {Array<{price?: number, qty?: number}>} [cart=[]] - Cart items.
 * @param {number} [discountPct=0] - Discount percentage to apply (for example from a coupon).
 * @param {{id?: string, price?: number}|null} selectedShipping - Selected shipping method.
 * @param {number} [pointsDiscountAmount=0] - Fixed shekel amount deducted for redeemed loyalty points.
 * @returns {number} The final amount the customer has to pay.
 */
export function getTotal(cart = [], discountPct = 0, selectedShipping, pointsDiscountAmount = 0) {
  const subtotal = getSubtotal(cart);
  const discountAmount = getDiscountAmount(subtotal, discountPct);
  const shippingCost = getShippingCost(selectedShipping, subtotal);
  const afterDiscounts = Math.max(
    0,
    subtotal - discountAmount - (Number(pointsDiscountAmount) || 0)
  );

  return afterDiscounts + shippingCost;
}