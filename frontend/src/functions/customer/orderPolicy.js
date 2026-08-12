const ONE_HOUR_MS = 60 * 60 * 1000;
const CANCEL_WINDOW_MS = 24 * ONE_HOUR_MS;
const RETURN_WINDOW_MS = 7 * 24 * ONE_HOUR_MS;

/**
 * בודקת האם לקוחה עדיין רשאית לבטל הזמנה.
 *
 * ניתן לבטל הזמנה רק אם:
 * - היא עוד לא בוטלה קודם
 * - היא עוד לא הגיעה לשלב האחרון של המשלוח (סטטוס 3)
 * - עברו פחות מ-24 שעות מרגע ביצוע ההזמנה
 *
 * @param {object} order - אובייקט ההזמנה.
 * @param {boolean} order.cancelled - האם ההזמנה כבר בוטלה.
 * @param {number} order.status - שלב המשלוח הנוכחי (0-3).
 * @param {string} order.createdAt - תאריך יצירת ההזמנה (ISO).
 * @param {string} [order.date] - תאריך גיבוי אם createdAt חסר.
 * @param {number} [now] - זמן נוכחי במילישניות (ברירת מחדל Date.now(), ניתן להזרקה לצורך בדיקות).
 * @returns {boolean} true אם עדיין ניתן לבטל את ההזמנה.
 */
export function canCancelOrder(order, now = Date.now()) {
  if (!order) return false;
  if (order.cancelled) return false;
  if (Number(order.status) === 3) return false;

  const createdTimestamp = new Date(order.createdAt || order.date).getTime();
  if (Number.isNaN(createdTimestamp)) return false;

  return now - createdTimestamp < CANCEL_WINDOW_MS;
}

/**
 * בודקת האם לקוחה עדיין נמצאת בחלון הזמן להגשת בקשת החזרה עבור הזמנה שנמסרה.
 *
 * ניתן להגיש בקשת החזרה רק אם:
 * - ההזמנה הגיעה לשלב האחרון של המשלוח (סטטוס 3)
 * - עברו פחות מ-7 ימים ממועד המסירה
 *   (במקרה ש-deliveredAt חסר, נופלים חזרה ל-createdAt/date)
 *
 * @param {object} order - אובייקט ההזמנה.
 * @param {number} order.status - שלב המשלוח הנוכחי (0-3).
 * @param {string} [order.deliveredAt] - תאריך המסירה (ISO).
 * @param {string} [order.createdAt] - תאריך גיבוי.
 * @param {string} [order.date] - תאריך גיבוי נוסף.
 * @param {number} [now] - זמן נוכחי במילישניות (ברירת מחדל Date.now(), ניתן להזרקה לצורך בדיקות).
 * @returns {boolean} true אם עדיין ניתן להגיש בקשת החזרה.
 */
export function canRequestReturn(order, now = Date.now()) {
  if (!order) return false;
  if (Number(order.status) !== 3) return false;

  const deliveredTimestamp = new Date(
    order.deliveredAt || order.createdAt || order.date
  ).getTime();

  if (Number.isNaN(deliveredTimestamp)) return false;

  return now - deliveredTimestamp < RETURN_WINDOW_MS;
}