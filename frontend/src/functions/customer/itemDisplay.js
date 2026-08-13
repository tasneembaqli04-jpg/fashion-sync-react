/**
 * Helpers for displaying an order item in the correct language.
 *
 * Every cart item is stored with two pairs of fields: name/nameEn and
 * color/colorEn (see addToCart in cart.js). These helpers pick the value that
 * matches the current language, always falling back to Hebrew when the
 * translation is missing.
 *
 * The logic lives here so it is not duplicated in every screen that renders
 * order items.
 */

// Gift card name as stored in older orders, before the nameEn field existed.
const LEGACY_GIFT_CARD_NAME = "כרטיס מתנה FashionSync";
const LEGACY_GIFT_CARD_NAME_EN = "FashionSync Gift Card";

// One-size value. Stored in Hebrew only, so it is translated at render time.
const ONE_SIZE_HE = "אחיד";
const ONE_SIZE_EN = "One Size";

/**
 * Returns the item name in the requested language.
 *
 * In English, an item without nameEn falls back to Hebrew — except for legacy
 * gift cards, which have a known translation.
 *
 * @param {object|null} item - The order item.
 * @param {string} lang - Current language ("he" or "en").
 * @returns {string} Name to display, or an empty string when there is no item.
 */
export function getItemName(item, lang) {
  if (!item) {
    return "";
  }

  if (lang !== "en") {
    return item.name || "";
  }

  if (item.nameEn) {
    return item.nameEn;
  }

  if (item.name === LEGACY_GIFT_CARD_NAME) {
    return LEGACY_GIFT_CARD_NAME_EN;
  }

  return item.name || "";
}

/**
 * Returns the item colour in the requested language.
 *
 * @param {object|null} item - The order item.
 * @param {string} lang - Current language ("he" or "en").
 * @returns {string} Colour to display, or an empty string when there is none.
 */
export function getItemColor(item, lang) {
  if (!item) {
    return "";
  }

  if (lang === "en" && item.colorEn) {
    return item.colorEn;
  }

  return item.color || "";
}

/**
 * Returns the item size in the requested language.
 *
 * Sizes themselves (S, M, L) are language independent. The only one that is
 * translated is "אחיד" (one size).
 *
 * @param {object|null} item - The order item.
 * @param {string} lang - Current language ("he" or "en").
 * @returns {string} Size to display, or an empty string when there is none.
 */
export function getItemSize(item, lang) {
  if (!item) {
    return "";
  }

  if (lang === "en" && item.size === ONE_SIZE_HE) {
    return ONE_SIZE_EN;
  }

  return item.size || "";
}
