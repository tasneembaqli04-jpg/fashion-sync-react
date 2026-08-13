/**
 * פונקציות עזר להצגת פריט הזמנה בשפה הנכונה.
 *
 * כל פריט בעגלה נשמר עם שני זוגות שדות: name/nameEn ו-color/colorEn
 * (ראה addToCart ב-cart.js). הפונקציות כאן בוחרות את הערך המתאים לשפה
 * הנוכחית, ותמיד נופלות חזרה לעברית כשהתרגום חסר.
 *
 * הלוגיקה רוכזה כאן כדי שלא תשוכפל בכל מסך שמציג פריטי הזמנה.
 */

// שם כרטיס המתנה כפי שנשמר בהזמנות ישנות, מלפני שנוסף השדה nameEn.
const LEGACY_GIFT_CARD_NAME = "כרטיס מתנה FashionSync";
const LEGACY_GIFT_CARD_NAME_EN = "FashionSync Gift Card";

// מידה אחידה. נשמרת בעברית בלבד, ולכן מתורגמת בזמן התצוגה.
const ONE_SIZE_HE = "אחיד";
const ONE_SIZE_EN = "One Size";

/**
 * מחזירה את שם הפריט בשפה המבוקשת.
 *
 * כאשר השפה אנגלית אך לפריט אין nameEn, נעשית נפילה לעברית — למעט
 * כרטיסי מתנה ישנים, שעבורם קיים תרגום ידוע.
 *
 * @param {object|null} item - פריט ההזמנה.
 * @param {string} lang - השפה הנוכחית ("he" או "en").
 * @returns {string} שם הפריט להצגה, או מחרוזת ריקה אם אין פריט.
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
 * מחזירה את צבע הפריט בשפה המבוקשת.
 *
 * @param {object|null} item - פריט ההזמנה.
 * @param {string} lang - השפה הנוכחית ("he" או "en").
 * @returns {string} הצבע להצגה, או מחרוזת ריקה כשאין צבע.
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
 * מחזירה את מידת הפריט בשפה המבוקשת.
 *
 * המידות עצמן (S, M, L) אינן תלויות שפה. היחידה שמתורגמת היא "אחיד".
 *
 * @param {object|null} item - פריט ההזמנה.
 * @param {string} lang - השפה הנוכחית ("he" או "en").
 * @returns {string} המידה להצגה, או מחרוזת ריקה כשאין מידה.
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
