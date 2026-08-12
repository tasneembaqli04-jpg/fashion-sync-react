/**
 * מחשבת את סכום הביניים של עגלת קניות, לפני הנחות או משלוח.
 *
 * @param {Array<{price?: number, qty?: number}>} [cart=[]] - פריטי העגלה, כל אחד עם מחיר וכמות.
 * @returns {number} סכום של (מחיר × כמות) על פני כל הפריטים. מחיר/כמות חסרים נחשבים כ-0.
 */
export function getSubtotal(cart = []) {
  return cart.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.qty || 0);
  }, 0);
}

/**
 * מחשבת את סכום ההנחה מקופון או מבצע באחוזים.
 *
 * @param {number} [subtotal=0] - סכום הביניים של העגלה לפני ההנחה.
 * @param {number} [discountPct=0] - אחוז ההנחה (למשל 10 עבור 10% הנחה).
 * @returns {number} סכום ההנחה בשקלים, מעוגל למספר שלם קרוב.
 */
export function getDiscountAmount(subtotal = 0, discountPct = 0) {
  return Math.round(subtotal * (Number(discountPct || 0) / 100));
}

/**
 * קובעת את עלות המשלוח עבור שיטת המשלוח שנבחרה.
 *
 * משלוח רגיל ניתן חינם כאשר סכום הביניים מגיע ל-₪200. כל שאר שיטות
 * המשלוח (מהיר, אותו יום, איסוף עצמי) תמיד גובות את המחיר הרשום שלהן,
 * ללא קשר לסכום הביניים.
 *
 * @param {{id?: string, price?: number}|null} selectedShipping - שיטת המשלוח שנבחרה, או null אם לא נבחרה שיטה.
 * @param {number} [subtotal=0] - סכום הביניים של העגלה, לבדיקת סף המשלוח החינמי.
 * @returns {number} עלות המשלוח. 0 אם לא נבחרה שיטת משלוח.
 */
export function getShippingCost(selectedShipping, subtotal = 0) {
  if (!selectedShipping) return 0;

  if (selectedShipping.id === "standard" && subtotal >= 200) {
    return 0;
  }

  return Number(selectedShipping.price || 0);
}

/**
 * מחשבת את סה"כ ההזמנה הסופי: סכום ביניים, בניכוי הנחה באחוזים והנחת
 * נקודות נאמנות, בתוספת עלות משלוח. לעולם לא מחזירה סכום שלילי לפני
 * הוספת המשלוח (מוגבל ל-0 כמינימום).
 *
 * @param {Array<{price?: number, qty?: number}>} [cart=[]] - פריטי העגלה.
 * @param {number} [discountPct=0] - אחוז הנחה להחלה (למשל מקופון).
 * @param {{id?: string, price?: number}|null} selectedShipping - שיטת המשלוח שנבחרה.
 * @param {number} [pointsDiscountAmount=0] - סכום קבוע בשקלים המנוכה עבור נקודות נאמנות שמומשו.
 * @returns {number} הסכום הסופי שעל הלקוחה לשלם.
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