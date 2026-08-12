/**
 * בודקת האם וריאנט מוצר ספציפי (צבע + מידה) ניתן להוספה לעגלה,
 * לפי נתוני המלאי החיים.
 *
 * כללים:
 * - מוצר ללא וריאנטים (ספירת מלאי פשוטה) זמין אם stock > 0.
 * - מוצר עם וריאנטים זמין רק אם לצירוף הצבע+מידה הספציפי יש כמות חיובית.
 * - מידה מותאמת אישית ("אחר") תמיד נחשבת זמינה, כי היא מטופלת
 *   מחוץ למערכת המלאי הרגילה ודורשת בדיקה ידנית.
 *
 * @param {object} product - המוצר שנבדק.
 * @param {Array<object>} [product.variants] - רשימת וריאנטים, כל אחד עם colorName ומפת sizes.
 * @param {number} [product.stock] - ספירת מלאי פשוטה, בשימוש כשאין וריאנטים.
 * @param {object} selection - הצבע/מידה שנבחרו.
 * @param {string} selection.color - שם הצבע שנבחר.
 * @param {string} selection.size - המידה שנבחרה.
 * @returns {boolean} true אם ניתן להוסיף את הפריט לעגלה.
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