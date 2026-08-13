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