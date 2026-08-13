const {db} = require("../../config/firebaseAdmin");

const PRODUCTS_COLLECTION = "products";
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 100;

// ערך העונה שמסמן מוצר שמתאים לכל השנה.
const ALL_SEASONS_VALUE = "כל העונות";

// המרת אותיות סופיות לצורתן הרגילה, לצורך השוואת מילים בחיפוש.
const FINAL_LETTER_FORMS = Object.freeze({
  "ך": "כ",
  "ם": "מ",
  "ן": "נ",
  "ף": "פ",
  "ץ": "צ",
});

// אורך הבסיס המינימלי שמותר להתאים לפיו תחילית של מילה.
// בסיס קצר מזה מחייב התאמה מדויקת, כדי למנוע תוצאות רועשות.
const MIN_STEM_PREFIX_LENGTH = 3;

// מפת מילות מפתח לאירועים.
// המפתח הוא מילת טריגר שמחפשים בתוך טקסט האירוע החופשי שמגיע מהמודל,
// והערך הוא מילות המפתח שמחפשים בשם ובתיאור של המוצר.
// המוצרים עצמם אינם מכילים שדה אירוע, ולכן ההתאמה היא טקסטואלית.
//
// חשוב: כל מילה כאן חייבת להיות באורך שלושה תווים לפחות, אחרת היא
// עלולה להתאים בטעות בתוך מילים אחרות בעברית.
const OCCASION_KEYWORDS = Object.freeze({
  "חתונה": ["ערב", "קוקטייל", "אלגנט", "מקסי"],
  "אירוע": ["ערב", "קוקטייל", "אלגנט", "מקסי"],
  "חגיגה": ["ערב", "קוקטייל", "אלגנט", "מקסי"],
  "ערב": ["ערב", "קוקטייל", "אלגנט", "מקסי"],
  "עבודה": ["משרד", "קלאסי", "מכופתר"],
  "ראיון": ["משרד", "קלאסי", "מכופתר"],
  "משרד": ["משרד", "קלאסי", "מכופתר"],
  "דייט": ["קוקטייל", "מיני", "ערב"],
  "מסיבה": ["קוקטייל", "מיני", "ערב"],
  "חופשה": ["קיץ", "פרחוני", "מקסי", "קליל"],
  "טיול": ["קיץ", "פרחוני", "מקסי", "קליל"],
  "לימודים": ["יומיומי", "כותנה", "סריג", "בסיסי"],
  "יומיום": ["יומיומי", "כותנה", "סריג", "בסיסי"],
});

/**
 * Normalizes text for safe comparisons.
 *
 * @param {*} value Value to normalize.
 * @return {string} Normalized text.
 */
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[׳’‘`]/g, "'")
    .replace(/[״“”]/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Converts a Firestore document into a normalized product object.
 *
 * @param {FirebaseFirestore.DocumentSnapshot} documentSnapshot
 * Firestore product document.
 * @return {object} Normalized product.
 */
function normalizeProduct(documentSnapshot) {
  const data = documentSnapshot.data() || {};

  return {
    id: documentSnapshot.id,
    code: data.code || documentSnapshot.id,
    name: data.name || "",
    category: data.cat || data.category || "",
    gender: data.gender || "",
    season: data.season || "",
    price: Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    img: data.img || "",
    desc: data.desc || "",
    sale: data.sale || null,
    variants: Array.isArray(data.variants) ? data.variants : [],
    bestseller: Boolean(data.bestseller),
    trending: Boolean(data.trending),
  };
}

/**
 * מנרמלת מילה עברית לצורת השוואה.
 *
 * שני צעדים בלבד, שניהם כתיביים ולא סמנטיים:
 *
 * 1. אותיות סופיות מומרות לצורתן הרגילה (ך ם ן ף ץ). כך "אדום"
 *    ו-"אדומה" מגיעות לאותו בסיס.
 * 2. ה' או ת' בסוף מילה בת ארבעה תווים לפחות נחתכת. זו נטיית
 *    הסמיכות בעברית: "שמלה" מול "שמלת", "חולצה" מול "חולצת".
 *
 * המגבלה של ארבעה תווים שומרת על בסיס באורך שלושה תווים לפחות,
 * כדי שמילים קצרות לא יתקצרו לכדי רעש.
 *
 * @param {string} word המילה לנרמול.
 * @return {string} בסיס ההשוואה.
 */
function toHebrewStem(word) {
  const withoutFinals = word.replace(
      /[ךםןףץ]/g,
      (letter) => FINAL_LETTER_FORMS[letter],
  );

  if (withoutFinals.length >= 4 && /[הת]$/.test(withoutFinals)) {
    return withoutFinals.slice(0, -1);
  }

  return withoutFinals;
}

/**
 * בודקת אם מילת חיפוש אחת מתאימה לאחת ממילות המוצר.
 *
 * ההשוואה היא על תחילית של מילה שלמה, ולא על רצף תווים כלשהו בתוך
 * הטקסט. כך "ערב" מתאימה למילה "ערב" אך לא לתוך "מעורב".
 *
 * @param {string} queryWord מילה מתוך טקסט החיפוש.
 * @param {string[]} productWords מילות המוצר.
 * @return {boolean} האם נמצאה התאמה.
 */
function wordMatchesProductWords(queryWord, productWords) {
  const queryStem = toHebrewStem(queryWord);

  return productWords.some((productWord) => {
    const productStem = toHebrewStem(productWord);

    if (productStem === queryStem) {
      return true;
    }

    // התאמת תחילית מותרת רק לבסיס ארוך דיו, כדי לא לגרור רעש.
    if (queryStem.length < MIN_STEM_PREFIX_LENGTH) {
      return false;
    }

    return (
      productStem.startsWith(queryStem) ||
      queryStem.startsWith(productStem)
    );
  });
}

/**
 * Checks whether a product matches free-text search.
 *
 * החיפוש מפוצל למילים: כל מילה בבקשה חייבת להימצא איפשהו בטקסט
 * המוצר, ללא תלות בסדר או ברציפות. כך "שמלה ערב" מוצא גם
 * "שמלת ערב אלגנטית".
 *
 * כל מילה נבדקת בשתי דרכים, ומספיק שאחת מהן תתקיים:
 * 1. הופעה כרצף תווים בטקסט המוצר — בדיוק ההתנהגות הקודמת,
 *    כדי שאף תוצאה שעבדה עד היום לא תיעלם.
 * 2. התאמה לבסיס של מילה שלמה, שמטפלת בנטיות כמו שמלה/שמלת.
 *
 * @param {object} product Product to inspect.
 * @param {string} searchText Requested search text.
 * @return {boolean} Whether the product matches.
 */
function productMatchesText(product, searchText) {
  if (!searchText) {
    return true;
  }

  const normalizedSearch = normalizeText(searchText);

  if (!normalizedSearch) {
    return true;
  }

  const searchableText = normalizeText(
    [
      product.code,
      product.name,
      product.category,
      product.gender,
      product.desc,
    ].join(" ")
  );

  // כל מילה בבקשה נדרשת, גם מילים קצרות. אין השמטת מילים:
  // בעברית מילה בת שתי אותיות כמו "בד" היא שם עצם משמעותי,
  // והשמטתה הייתה הופכת "נעלי בד" לכל הנעליים בקטלוג.
  const queryWords = normalizedSearch.split(" ").filter(Boolean);

  const productWords = searchableText.split(" ").filter(Boolean);

  return queryWords.every(
      (queryWord) =>
        searchableText.includes(queryWord) ||
        wordMatchesProductWords(queryWord, productWords),
  );
}

/**
 * Checks whether a product has a requested size in stock.
 *
 * Supports both the old array format and the current object format.
 *
 * @param {object} product Product to inspect.
 * @param {string|null} requestedSize Requested size.
 * @return {boolean} Whether the requested size is available.
 */
function productHasSize(product, requestedSize) {
  if (!requestedSize) {
    return true;
  }

  const normalizedRequestedSize =
    normalizeText(requestedSize).toUpperCase();

  return product.variants.some((variant) => {
    const sizes = variant?.sizes;

    if (Array.isArray(sizes)) {
      return sizes.some((size) => {
        if (
          typeof size === "string" ||
          typeof size === "number"
        ) {
          return (
            String(size).toUpperCase() ===
            normalizedRequestedSize
          );
        }

        const sizeValue =
          size?.size ||
          size?.name ||
          size?.label ||
          size?.value ||
          "";

        const quantity =
          size?.quantity ??
          size?.stock ??
          size?.qty ??
          null;

        const matchesSize =
          String(sizeValue).toUpperCase() ===
          normalizedRequestedSize;

        if (quantity === null || quantity === undefined) {
          return matchesSize;
        }

        return matchesSize && Number(quantity) > 0;
      });
    }

    if (sizes && typeof sizes === "object") {
      return Object.entries(sizes).some(
        ([sizeName, quantity]) =>
          String(sizeName).toUpperCase() ===
            normalizedRequestedSize &&
          Number(quantity) > 0
      );
    }

    return false;
  });
}

/**
 * Checks whether a product has the requested color.
 *
 * @param {object} product Product to inspect.
 * @param {string|null} requestedColor Requested color.
 * @return {boolean} Whether the product matches the color.
 */
function productHasColor(product, requestedColor) {
  if (!requestedColor) {
    return true;
  }

  const normalizedRequestedColor =
    normalizeText(requestedColor);

  return product.variants.some((variant) => {
    const colorName =
      variant?.colorName ||
      variant?.color ||
      variant?.name ||
      "";

    const normalizedColorName = normalizeText(colorName);

    return (
      normalizedColorName.includes(normalizedRequestedColor) ||
      normalizedRequestedColor.includes(normalizedColorName)
    );
  });
}

/**
 * Checks whether a product is currently on sale.
 *
 * @param {object} product Product to inspect.
 * @return {boolean} Whether the product is on sale.
 */
function isProductOnSale(product) {
  if (!product.sale) {
    return false;
  }

  if (typeof product.sale === "boolean") {
    return product.sale;
  }

  if (typeof product.sale === "number") {
    return product.sale > 0;
  }

  if (typeof product.sale === "object") {
    return Boolean(
      product.sale.active ||
      product.sale.enabled ||
      Number(product.sale.discount) > 0 ||
      Number(product.sale.percent) > 0
    );
  }

  return false;
}

/**
 * Calculates the available product stock.
 *
 * Uses both the direct stock field and stock stored inside variants.
 *
 * @param {object} product Product to inspect.
 * @return {number} Available stock.
 */
function getProductAvailableStock(product) {
  const variantStock = product.variants.reduce(
    (total, variant) => {
      const sizes = variant?.sizes;

      if (Array.isArray(sizes)) {
        const sizesStock = sizes.reduce(
          (sizeTotal, size) => {
            if (typeof size === "number") {
              return sizeTotal + Math.max(size, 0);
            }

            if (size && typeof size === "object") {
              const quantity = Number(
                size.quantity ??
                size.stock ??
                size.qty ??
                0
              );

              return (
                sizeTotal +
                Math.max(quantity || 0, 0)
              );
            }

            return sizeTotal;
          },
          0
        );

        return total + sizesStock;
      }

      if (sizes && typeof sizes === "object") {
        const sizesStock = Object.values(sizes).reduce(
          (sizeTotal, quantity) =>
            sizeTotal +
            Math.max(Number(quantity) || 0, 0),
          0
        );

        return total + sizesStock;
      }

      return total;
    },
    0
  );

  return Math.max(
    Number(product.stock) || 0,
    variantStock
  );
}

/**
 * מחזירה את מילות המפתח שמתאימות לטקסט האירוע שהתקבל מהמודל.
 *
 * ההתאמה היא includes ולא שוויון מדויק, מכיוון שהמודל מחזיר טקסט חופשי
 * כמו "חתונה של חברה" ולא ערך מתוך רשימה סגורה.
 *
 * כאשר טקסט האירוע מכיל כמה טריגרים (למשל "מסיבת חתונה"), מאוחדות
 * מילות המפתח של כולם.
 *
 * @param {string|null} occasion טקסט האירוע מתוך ה-intent.
 * @return {string[]} מילות המפתח לחיפוש בשם ובתיאור המוצר.
 */
function getOccasionKeywords(occasion) {
  const normalizedOccasion = normalizeText(occasion);

  if (!normalizedOccasion) {
    return [];
  }

  const keywords = new Set();
  const entries = Object.entries(OCCASION_KEYWORDS);

  for (const [trigger, triggerKeywords] of entries) {
    if (normalizedOccasion.includes(trigger)) {
      triggerKeywords.forEach((keyword) => keywords.add(keyword));
    }
  }

  return Array.from(keywords);
}

/**
 * מחשבת ציון רלוונטיות למוצר ביחס לאירוע, לסגנון ולעונה שהתבקשו.
 *
 * הציון משמש למיון בלבד ולעולם אינו פוסל מוצר: מוצר שאינו מתאים מקבל
 * ציון 0 ויורד לתחתית הרשימה, אך נשאר בתוצאות. כך מובטח שהחיפוש לא
 * יחזיר רשימה ריקה בגלל האירוע.
 *
 * @param {object} product המוצר המנורמל.
 * @param {string[]} occasionKeywords מילות המפתח של האירוע.
 * @param {string|null} style הסגנון המבוקש.
 * @param {string|null} season העונה המבוקשת.
 * @return {number} ציון הרלוונטיות.
 */
function getProductRelevanceScore(product, occasionKeywords, style, season) {
  let score = 0;

  const productText = [product.name, product.desc].join(" ");
  const searchableText = normalizeText(productText);

  const matchesOccasion = occasionKeywords.some(
      (keyword) => searchableText.includes(keyword),
  );

  if (matchesOccasion) {
    score += 3;
  }

  const normalizedStyle = normalizeText(style);

  if (
    normalizedStyle &&
    searchableText.includes(normalizedStyle)
  ) {
    score += 2;
  }

  const normalizedSeason = normalizeText(season);
  const normalizedProductSeason = normalizeText(product.season);

  if (
    normalizedSeason &&
    normalizedProductSeason &&
    (normalizedProductSeason === normalizedSeason ||
      normalizedProductSeason === ALL_SEASONS_VALUE)
  ) {
    score += 1;
  }

  return score;
}

/**
 * Finds a product by its code.
 *
 * @param {string} code Product code.
 * @return {Promise<object|null>} Matching product or null.
 */
async function getProductByCode(code) {
  if (!code) {
    return null;
  }

  const normalizedCode =
    String(code).trim().toUpperCase();

  const directDocument = await db
    .collection(PRODUCTS_COLLECTION)
    .doc(normalizedCode)
    .get();

  if (directDocument.exists) {
    return normalizeProduct(directDocument);
  }

  const querySnapshot = await db
    .collection(PRODUCTS_COLLECTION)
    .where("code", "==", normalizedCode)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  return normalizeProduct(querySnapshot.docs[0]);
}

/**
 * Searches the product catalog using structured filters.
 *
 * @param {object} options Search options.
 * @param {string} options.searchText Free-text search.
 * @param {string|null} options.category Product category.
 * @param {string|null} options.gender Product gender.
 * @param {string|null} options.size Requested size.
 * @param {string|null} options.color Requested color.
 * @param {number|null} options.maxPrice Maximum price.
 * @param {number|null} options.minPrice Minimum price.
 * @param {boolean} options.inStockOnly Whether to require stock.
 * @param {boolean} options.saleOnly Whether to require a sale.
 * @param {string|null} options.occasion האירוע המבוקש. משמש לניקוד בלבד.
 * @param {string|null} options.style הסגנון המבוקש. משמש לניקוד בלבד.
 * @param {string|null} options.season העונה המבוקשת. משמשת לניקוד בלבד.
 * @param {number} options.limit Maximum number of results.
 * @return {Promise<object[]>} Matching products.
 */
async function searchProducts({
  searchText = "",
  category = null,
  gender = null,
  size = null,
  color = null,
  maxPrice = null,
  minPrice = null,
  inStockOnly = false,
  saleOnly = false,
  occasion = null,
  style = null,
  season = null,
  limit = DEFAULT_LIMIT,
} = {}) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const snapshot = await db
    .collection(PRODUCTS_COLLECTION)
    .limit(200)
    .get();

  let products = snapshot.docs.map(normalizeProduct);

  products = products.filter((product) => {
    if (
      category &&
      normalizeText(product.category) !==
        normalizeText(category)
    ) {
      return false;
    }

    if (
      gender &&
      normalizeText(product.gender) !==
        normalizeText(gender)
    ) {
      return false;
    }

    if (!productMatchesText(product, searchText)) {
      return false;
    }

    if (
      maxPrice !== null &&
      product.price > Number(maxPrice)
    ) {
      return false;
    }

    if (
      minPrice !== null &&
      product.price < Number(minPrice)
    ) {
      return false;
    }

    if (
      inStockOnly &&
      getProductAvailableStock(product) <= 0
    ) {
      return false;
    }

    if (!productHasSize(product, size)) {
      return false;
    }

    if (!productHasColor(product, color)) {
      return false;
    }

    if (saleOnly && !isProductOnSale(product)) {
      return false;
    }

    return true;
  });

  // ניקוד רלוונטיות. משפיע על סדר התוצאות בלבד ולא פוסל אף מוצר.
  const occasionKeywords = getOccasionKeywords(occasion);

  products = products.map((product) => ({
    ...product,
    relevanceScore: getProductRelevanceScore(
        product,
        occasionKeywords,
        style,
        season,
    ),
  }));

  products.sort((firstProduct, secondProduct) => {
    const firstStock =
      getProductAvailableStock(firstProduct);

    const secondStock =
      getProductAvailableStock(secondProduct);

    if (firstStock > 0 && secondStock <= 0) {
      return -1;
    }

    if (firstStock <= 0 && secondStock > 0) {
      return 1;
    }

    // ציון גבוה יותר קודם.
    if (
      secondProduct.relevanceScore !==
      firstProduct.relevanceScore
    ) {
      return (
        secondProduct.relevanceScore -
        firstProduct.relevanceScore
      );
    }

    return firstProduct.price - secondProduct.price;
  });

  console.log("CHAT PRODUCTS FOUND:", products.length);

  return products.slice(0, safeLimit);
}

module.exports = {
  getProductByCode,
  searchProducts,
};