const {db} = require("../../config/firebaseAdmin");

const PRODUCTS_COLLECTION = "products";
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 100;

// Season value marking a product as suitable all year round. Products store
// their season as an English slug, so this is "all" rather than any Hebrew
// wording.
const ALL_SEASONS_VALUE = "all";

// Season words to the slug held on the product.
//
// The model returns the season as free text in the customer's own words
// ("קיץ", "לקיץ", "summer"), while a product carries one of four slugs. With
// no translation between the two, the comparison could never succeed and the
// season point was never awarded to any product.
const SEASON_SLUGS = Object.freeze({
  "קיץ": "summer",
  "חורף": "winter",
  "אביב": "spring-autumn",
  "סתיו": "spring-autumn",
  "summer": "summer",
  "winter": "winter",
  "spring": "spring-autumn",
  "autumn": "spring-autumn",
  "fall": "spring-autumn",
});

/**
 * Resolves the requested season to the slug products are stored with.
 *
 * Matching is by containment rather than equality, because the model writes a
 * phrase rather than a single word.
 *
 * @param {string|null} season Season text from the intent.
 * @return {string} The matching slug, or an empty string.
 */
function toSeasonSlug(season) {
  const normalized = normalizeText(season);

  if (!normalized) {
    return "";
  }

  for (const [word, slug] of Object.entries(SEASON_SLUGS)) {
    if (normalized.includes(word)) {
      return slug;
    }
  }

  return "";
}

// Hebrew final letters mapped to their regular form, for word comparison.
const FINAL_LETTER_FORMS = Object.freeze({
  "ך": "כ",
  "ם": "מ",
  "ן": "נ",
  "ף": "פ",
  "ץ": "צ",
});

// Shortest stem allowed for prefix matching. Anything shorter requires an
// exact match, so short stems cannot pull in unrelated results.
const MIN_STEM_PREFIX_LENGTH = 3;

// Occasion keyword map. The key is a trigger looked up inside the free-text
// occasion returned by the model; the value lists keywords searched in the
// product name and description. Products carry no occasion field, so the
// match is textual.
//
// Every word here must be at least three characters long — shorter words can
// match accidentally inside unrelated Hebrew words.
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
    // Carried through so the interface can show the product in the language
    // the customer is reading. Without it the reply arrives in English with
    // Hebrew product names inside it, because the screen has nothing else to
    // fall back to.
    nameEn: data.nameEn || "",
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
 * Reduces a Hebrew word to a comparison stem.
 *
 * Two orthographic steps only, no semantic stemming:
 *
 * 1. Final letters are folded to their regular form (ך ם ן ף ץ), so that
 *    "אדום" and "אדומה" reach the same stem.
 * 2. A trailing ה or ת is dropped from words of at least four characters.
 *    This is the Hebrew construct state: "שמלה" vs "שמלת".
 *
 * The four-character floor keeps every stem at three characters or more, so
 * short words are never reduced to noise.
 *
 * @param {string} word Word to normalize.
 * @return {string} Comparison stem.
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
 * Checks whether one search word matches any of the product words.
 *
 * Matching is on whole-word prefixes, not on an arbitrary character run
 * inside the text, so "ערב" matches the word "ערב" but not "מעורב".
 *
 * @param {string} queryWord Word from the search text.
 * @param {string[]} productWords Words taken from the product.
 * @return {boolean} Whether a match was found.
 */
function wordMatchesProductWords(queryWord, productWords) {
  const queryStem = toHebrewStem(queryWord);

  return productWords.some((productWord) => {
    const productStem = toHebrewStem(productWord);

    if (productStem === queryStem) {
      return true;
    }

    // Prefix matching is allowed only for stems long enough to be specific.
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
 * The query is split into words: every word must appear somewhere in the
 * product text, regardless of order or adjacency, so "שמלה ערב" also finds
 * "שמלת ערב אלגנטית".
 *
 * Each word is tested two ways and either one is enough:
 * 1. As a character run inside the product text, which is the broader of the
 *    two and catches matches that fall inside a longer word.
 * 2. As a whole-word stem match, which handles forms like שמלה vs שמלת.
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
      ].join(" "),
  );

  // Every query word is required, including short ones. No stop-word list:
  // a two-letter Hebrew word such as "בד" (fabric) is a meaningful noun, and
  // dropping it would turn "נעלי בד" into every shoe in the catalogue.
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
          Number(quantity) > 0,
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
      Number(product.sale.percent) > 0,
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
                0,
                  );

                  return (
                    sizeTotal +
                Math.max(quantity || 0, 0)
                  );
                }

                return sizeTotal;
              },
              0,
          );

          return total + sizesStock;
        }

        if (sizes && typeof sizes === "object") {
          const sizesStock = Object.values(sizes).reduce(
              (sizeTotal, quantity) =>
                sizeTotal +
            Math.max(Number(quantity) || 0, 0),
              0,
          );

          return total + sizesStock;
        }

        return total;
      },
      0,
  );

  return Math.max(
      Number(product.stock) || 0,
      variantStock,
  );
}

/**
 * Returns the keywords matching the occasion text produced by the model.
 *
 * Matching uses includes rather than equality, because the model returns free
 * text such as "חתונה של חברה" rather than a value from a closed list.
 *
 * When the occasion text contains several triggers (for example
 * "מסיבת חתונה"), the keywords of all of them are merged.
 *
 * @param {string|null} occasion Occasion text from the intent.
 * @return {string[]} Keywords to search in the product name and description.
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
 * Orders two scored products for display.
 *
 * Three comparisons, each breaking ties in the one before:
 *
 * 1. In stock first. A sold-out product the customer cannot buy belongs below
 *    an available one however well it matches, so availability outranks the
 *    relevance score rather than being folded into it.
 * 2. Higher relevance score first.
 * 3. Cheaper first, so equally good matches are offered at the lower price.
 *
 * Expects `relevanceScore` to have been set on both products already.
 *
 * @param {object} firstProduct Product with a relevanceScore.
 * @param {object} secondProduct Product with a relevanceScore.
 * @return {number} Negative, zero or positive, as Array#sort expects.
 */
function compareProductsForDisplay(firstProduct, secondProduct) {
  const firstStock = getProductAvailableStock(firstProduct);
  const secondStock = getProductAvailableStock(secondProduct);

  if (firstStock > 0 && secondStock <= 0) {
    return -1;
  }

  if (firstStock <= 0 && secondStock > 0) {
    return 1;
  }

  // Higher score first.
  if (secondProduct.relevanceScore !== firstProduct.relevanceScore) {
    return secondProduct.relevanceScore - firstProduct.relevanceScore;
  }

  return firstProduct.price - secondProduct.price;
}

/**
 * Scores a product against the requested occasion, style and season.
 *
 * The score only affects ordering and never rejects a product: a product that
 * does not match scores 0 and sinks to the bottom, but stays in the results.
 * This guarantees the search cannot return an empty list because of the
 * occasion.
 *
 * @param {object} product Normalized product.
 * @param {string[]} occasionKeywords Keywords for the requested occasion.
 * @param {string|null} style Requested style.
 * @param {string|null} season Requested season.
 * @return {number} Relevance score.
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

  const requestedSeasonSlug = toSeasonSlug(season);
  const productSeasonSlug = normalizeText(product.season);

  if (
    requestedSeasonSlug &&
    productSeasonSlug &&
    (productSeasonSlug === requestedSeasonSlug ||
      productSeasonSlug === ALL_SEASONS_VALUE)
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
 * @param {string|null} options.occasion Requested occasion. Scoring only.
 * @param {string|null} options.style Requested style. Scoring only.
 * @param {string|null} options.season Requested season. Scoring only.
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
      MAX_LIMIT,
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

  // Relevance scoring. Affects result ordering only; rejects nothing.
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

  products.sort(compareProductsForDisplay);

  return products.slice(0, safeLimit);
}

module.exports = {
  getProductByCode,
  searchProducts,

  // Exported for their tests. These are the pure parts of the search: they
  // touch no database and no model, so they can be checked directly.
  toHebrewStem,
  wordMatchesProductWords,
  getProductRelevanceScore,
  compareProductsForDisplay,
  getProductAvailableStock,
};
