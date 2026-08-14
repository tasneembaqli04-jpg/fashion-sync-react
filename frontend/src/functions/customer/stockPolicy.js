/**
 * Classifies a product's stock level into exactly one status.
 *
 * Every product resolves to "out", "low" or "available" and never to none of
 * them, which is what lets the badge on screen and the inventory filter agree
 * by construction rather than by two parallel sets of conditions.
 *
 * Two inputs need deliberate handling:
 *
 * - A missing minStock coerces to a threshold of 0, so a stocked product is
 *   "available" rather than falling outside every category. Comparing against
 *   an undefined threshold yields false in both directions.
 * - A negative quantity counts as "out". It is not reachable through the
 *   purchase and restock paths, which clamp at zero, but a value edited
 *   directly in Firestore must still land somewhere.
 *
 * @param {*} stock - Quantity in stock.
 * @param {*} minStock - Threshold below which stock counts as low.
 * @returns {"out"|"low"|"available"} The stock status.
 */
export function getStockStatus(stock, minStock) {
  const quantity = Number(stock) || 0;
  const threshold = Number(minStock) || 0;

  if (quantity <= 0) {
    return "out";
  }

  if (quantity <= threshold) {
    return "low";
  }

  return "available";
}

/**
 * Checks whether a specific product variant (colour + size) can be added to
 * the cart, based on live stock data.
 *
 * Rules:
 * - A product without variants (simple stock count) is available if stock > 0.
 * - A product with variants is available only if that exact colour+size
 *   combination has a positive quantity.
 * - A custom size ("אחר") is always treated as available, because it is
 *   handled outside the regular stock system and needs a manual check.
 *
 * @param {object} product - The product being checked.
 * @param {Array<object>} [product.variants] - Variants, each with colorName and a sizes map.
 * @param {number} [product.stock] - Simple stock count, used when there are no variants.
 * @param {object} selection - The selected colour/size.
 * @param {string} selection.color - Selected colour name.
 * @param {string} selection.size - Selected size.
 * @returns {boolean} true when the item can be added to the cart.
 */
export function isVariantAvailable(product, selection) {
  if (!product) return false;

  const { color, size } = selection || {};

  if (size === "אחר") return true;

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  if (!hasVariants) {
    return Number(product.stock) > 0;
  }

  const matchingVariant = product.variants.find((v) => v.colorName === color);
  const availableQty = Number(matchingVariant?.sizes?.[size]) || 0;

  return availableQty > 0;
}