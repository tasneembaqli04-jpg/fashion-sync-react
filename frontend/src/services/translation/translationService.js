const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const KNOWN_COLOR_TRANSLATIONS = {
  "שחור": "Black",
  "לבן": "White",
  "אדום": "Red",
  "כחול": "Blue",
  "ירוק": "Green",
  "צהוב": "Yellow",
  "כתום": "Orange",
  "סגול": "Purple",
  "ורוד": "Pink",
  "חום": "Brown",
  "אפור": "Gray",
  "בז'": "Beige",
  "זהב": "Gold",
  "כסף": "Silver",
  "טורקיז": "Turquoise",
  "בורדו": "Burgundy",
  "חאקי": "Khaki",
  "שמנת": "Cream",
  "תכלת": "Light Blue",
  "אחיד": "One Size",
};

/**
 * שכבה 1 — מילון שמות מוצרים מלאים.
 *
 * MyMemory הוא זיכרון תרגום ולא מתרגם נוירוני: הוא מחזיר את ההתאמה
 * הקרובה ביותר מתוך מאגר שנתרם על ידי משתמשים. לכן מונחי אופנה
 * מקבלים תעתיק שגוי ("פיט" -> "Pit") או ג'יבריש מוזרק ("PL Sweat Pants").
 *
 * שם שמופיע כאן לא נשלח ל-API בכלל — תרגום מדויק, מיידי, וללא
 * צריכה ממכסת הבקשות היומית.
 */
const KNOWN_PRODUCT_TRANSLATIONS = {
  // תעתיק במקום תרגום
  "ג'ינס סלים פיט": "Slim Fit Jeans",
  "חולצת קרופ": "Crop Top",
  "חולצת פפלום פרחונית": "Floral Peplum Top",
  "עליונית פוטר חמה": "Warm Fleece Top",

  // ג'יבריש שהוזרק מקטעים לא קשורים במאגר
  "מכנסי טרנינג": "Sweatpants",
  "מכנסי מותן גבוה": "High Waist Pants",

  // הומונים — המילה הנכונה במשמעות הלא נכונה
  "חולצת שרוולים תפוחים": "Puff Sleeve Top",
  "חולצת רקמה עדינה": "Fine Embroidered Top",

  // מונחי אופנה שגויים
  "ג'קט טרנינג": "Track Jacket",
  "כפכפי ים": "Flip Flops",
  "כפכפי קיץ נוחים": "Comfortable Summer Flip Flops",
  "מעיל פוך": "Puffer Coat",

  // מכנסיים ארוכים, לא קצרים
  "מכנסי דנים כהים": "Dark Denim Pants",
  "מכנסי עור מדומה": "Faux Leather Pants",

  // כאן ההחלפה האוטומטית Female -> Women's הייתה נותנת סדר מילים
  // שגוי ("Thermal Women's Tee"), ולכן השם נקבע במפורש.
  "חולצת תרמית נשית": "Women's Thermal Top",
};

/**
 * שכבה 3 — תיקונים על תוצאת ה-API.
 *
 * מיועד למוצרים חדשים שאינם במילון שלמעלה, אך מכילים מונח שכבר
 * ידוע לנו כמתורגם שגוי.
 */
const POST_TRANSLATION_FIXES = [
  // תעתיקים
  [/\bPit\b/g, "Fit"],
  [/\bKrupp\b/g, "Crop"],
  [/\bPapple\b/g, "Peplum"],
  [/\bFooter\b/g, "Fleece"],

  // הומונים
  [/\bApple Sleeve\b/g, "Puff Sleeve"],
  [/\bTissue\b/g, "Embroidered"],

  // אחידות ניסוח
  [/\bFemale\b/g, "Women's"],
  [/\bSunglass\b/g, "Sunglasses"],
];

// קידומות ג'יבריש ידועות שה-API מזריק לתחילת התרגום.
const GIBBERISH_PREFIXES = ["PL", "T7"];

/**
 * מנרמלת שם לצורך חיפוש במילון: מאחדת סוגי גרש, מכווצת רווחים כפולים
 * ומורידה רווחים מהקצוות. כך שם עם רווח כפול עדיין נמצא במילון.
 *
 * @param {string} text - השם המקורי.
 * @returns {string} מפתח חיפוש מנורמל.
 */
function normalizeLookupKey(text) {
  return String(text || "")
    .replace(/[׳’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// מילות קישור שנשארות באות קטנה ב-Title Case, אלא אם הן המילה הראשונה.
const TITLE_CASE_MINOR_WORDS = new Set([
  "a", "an", "and", "at", "for", "in", "of", "on", "or", "the", "to", "with",
]);

/**
 * ממירה טקסט ל-Title Case.
 *
 * מאותתת אות ראשונה בכל מילה וגם אחרי מקף ("V-neck" -> "V-Neck"),
 * אך לא אחרי גרש, כדי ש-"Women's" לא יהפוך ל-"Women'S".
 * מילות קישור נשארות קטנות ("Knit Top with Collar").
 *
 * @param {string} text - הטקסט להמרה.
 * @returns {string} הטקסט ב-Title Case.
 */
function toTitleCase(text) {
  return String(text || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && TITLE_CASE_MINOR_WORDS.has(word.toLowerCase())) {
        return word.toLowerCase();
      }

      return word.replace(
        /(^|-)([a-z])/g,
        (match, separator, letter) => separator + letter.toUpperCase()
      );
    })
    .join(" ");
}

/**
 * מנקה קידומת ג'יבריש מתחילת תרגום.
 *
 * מסירה רק אסימונים שאנחנו בטוחים לגביהם: רשימה שחורה ידועה, או
 * אסימון קצר שמכיל ספרה. כך קידומת לגיטימית כמו "UV" נשמרת.
 *
 * @param {string} text - התרגום מה-API.
 * @returns {string} התרגום ללא הקידומת.
 */
function stripGibberishPrefix(text) {
  const match = String(text || "").match(/^([A-Za-z0-9]{1,3})\s+(.+)$/);

  if (!match) {
    return text;
  }

  const [, prefix, rest] = match;
  const isBlacklisted = GIBBERISH_PREFIXES.includes(prefix.toUpperCase());
  const hasDigit = /\d/.test(prefix);

  return isBlacklisted || hasDigit ? rest : text;
}

/**
 * מחילה את כל תיקוני שכבה 3 על תרגום שהתקבל מה-API.
 *
 * מיוצאת גם לשימוש הסקריפט החד-פעמי שמתקן שמות קיימים ב-Firestore.
 *
 * @param {string} text - התרגום הגולמי.
 * @returns {string} התרגום המתוקן ב-Title Case.
 */
export function applyProductNameFixes(text) {
  const withoutPrefix = stripGibberishPrefix(String(text || "").trim());

  const fixed = POST_TRANSLATION_FIXES.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    withoutPrefix
  );

  return toTitleCase(fixed);
}

/**
 * מחזירה תרגום ידוע לשם מוצר, אם קיים במילון.
 *
 * מיוצאת גם לשימוש הסקריפט החד-פעמי.
 *
 * @param {string} name - שם המוצר בעברית.
 * @returns {string|null} התרגום הידוע, או null אם השם אינו במילון.
 */
export function getKnownProductTranslation(name) {
  return KNOWN_PRODUCT_TRANSLATIONS[normalizeLookupKey(name)] || null;
}

/**
 * מתרגמת שם מוצר: קודם מהמילון, ורק אם אין — דרך ה-API עם תיקונים.
 *
 * הפונקציה הזו מיועדת לשמות מוצרים בלבד. שמות לקוחות, כתובות והודעות
 * ממשיכים להשתמש ב-translateText הגנרי, שאסור להחיל עליו מונחי אופנה.
 *
 * @param {string} name - שם המוצר בעברית.
 * @returns {Promise<string>} שם המוצר באנגלית.
 */
export async function translateProductName(name) {
  const known = getKnownProductTranslation(name);

  if (known) {
    return known;
  }

  const translated = await translateText(name);

  return translated ? applyProductNameFixes(translated) : "";
}

function cleanTranslatedText(text) {
  return String(text || "")
    .trim()
    .replace(/[!?.,;:]+$/g, "")
    .trim();
}

export async function translateText(text, sourceLang = "he", targetLang = "en") {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";

  try {
    const params = new URLSearchParams({
      q: trimmed,
      langpair: `${sourceLang}|${targetLang}`,
    });

    const response = await fetch(`${MYMEMORY_URL}?${params.toString()}`);
    const data = await response.json();

    const translated = data?.responseData?.translatedText;

    if (!translated || data?.responseStatus !== 200) {
      console.error("Translation failed for:", trimmed, data);
      return "";
    }

    return cleanTranslatedText(translated);
  } catch (err) {
    console.error("Translation request failed:", err);
    return "";
  }
}

async function translateColorName(colorName) {
  const trimmed = String(colorName || "").trim();
  const known = KNOWN_COLOR_TRANSLATIONS[trimmed];

  if (known) return known;

  return await translateText(trimmed);
}

export async function translateProductFields({ name, desc, colorNames = [] }) {
  const [nameEn, descEn, ...colorTranslations] = await Promise.all([
    // שם המוצר עובר דרך המילון והתיקונים. התיאור נשאר תרגום חופשי.
    translateProductName(name),
    translateText(desc),
    ...colorNames.map((color) => translateColorName(color)),
  ]);

  return {
    nameEn,
    descEn,
    colorNamesEn: colorTranslations,
  };
}