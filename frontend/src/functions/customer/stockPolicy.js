/**
 * Determines whether a specific product variant (color + size) can be added
 * to the cart, based on live stock data.
 *
 * Rules:
 * - Products without variants (simple stock count) are available if stock > 0.
 * - Products with variants are available only if the specific
 *   color+size combination has a positive quantity.
 * - A custom size ("אחר") is always considered available, since it is
 *   handled outside the normal stock-tracking system and requires manual review.
 *
 * @param {object} product - The product being checked.
 * @param {Array<object>} [product.variants] - Variant list, each with colorName + sizes map.
 * @param {number} [product.stock] - Simple stock count, used when there are no variants.
 * @param {object} selection - The chosen color/size.
 * @param {string} selection.color - The chosen color name.
 * @param {string} selection.size - The chosen size.
 * @returns {boolean} True if the item is available to add to the cart.
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