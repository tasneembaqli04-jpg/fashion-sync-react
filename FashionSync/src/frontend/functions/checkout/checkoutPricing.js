export function getSubtotal(cart = []) {
  return cart.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.qty || 0);
  }, 0);
}

export function getDiscountAmount(subtotal = 0, discountPct = 0) {
  return Math.round(subtotal * (Number(discountPct || 0) / 100));
}

export function getShippingCost(selectedShipping, subtotal = 0) {
  if (!selectedShipping) return 0;

  if (selectedShipping.id === "standard" && subtotal >= 200) {
    return 0;
  }

  return Number(selectedShipping.price || 0);
}

export function getTotal(cart = [], discountPct = 0, selectedShipping) {
  const subtotal = getSubtotal(cart);
  const discountAmount = getDiscountAmount(subtotal, discountPct);
  const shippingCost = getShippingCost(selectedShipping, subtotal);

  return subtotal - discountAmount + shippingCost;
}