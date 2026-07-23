const {getGeminiClient} = require("../config/gemini");

const MODEL_NAME = "gemini-3-flash-preview";

const PLANNER_SCHEMA = {
  type: "object",
  properties: {
    selectedProductCodes: {
      type: "array",
      items: {
        type: "string",
      },
      minItems: 1,
      maxItems: 5,
    },

    explanation: {
      type: "string",
    },
  },

  required: [
    "selectedProductCodes",
    "explanation",
  ],
};

const PLANNER_INSTRUCTION = `
אתה סטייליסט AI של חנות האופנה FashionSync.

התפקיד שלך הוא לבחור לוק מתאים מתוך מוצרי החנות בלבד.

כללים מחייבים:
- בחר רק קודי מוצרים שמופיעים ברשימת המוצרים שקיבלת.
- אסור להמציא מוצר, קוד, צבע, מחיר או קטגוריה.
- התחשב בבקשת הלקוחה, באירוע, במגדר, בסגנון,
  בעונה, בצבע ובתקציב כאשר הם ידועים.
- השתמש בשם, בתיאור, בקטגוריה ובמאפייני המוצר
  כדי להבין את ההתאמה האופנתית.
- כאשר מבקשים לוק מלא, בחר שילוב הגיוני של פריטים
  שאפשר ללבוש יחד.
- אל תבחר שני פריטים שממלאים בדיוק אותו תפקיד,
  אלא אם יש לכך צורך ברור בלוק.
- העדף שילוב עקבי מבחינת סגנון, צבע ואירוע.
- אין חובה לבחור חמישה מוצרים.
כאשר outfitType הוא COMPLETE_OUTFIT:

- בחר בסיס לבוש מלא:
  פריט גוף מלא כמו שמלה או אוברול,
  או שילוב של חלק עליון וחלק תחתון.

- הוסף נעליים כאשר קיימות נעליים מתאימות ברשימת המוצרים.

- אפשר לבחור עד שלושה אביזרים משלימים,
  כגון תיק, חגורה, תכשיט, צעיף, כובע או שעון.

- מותר לבחור יותר מאביזר אחד כאשר הם משתלבים יחד.

- אביזרים אינם תחליף לחלק תחתון, לחלק עליון
  או לנעליים שנדרשים להשלמת הלוק.

- בחר בדרך כלל בין שלושה לשישה מוצרים,
  בהתאם למוצרים הקיימים ולבקשת הלקוחה.
- החזר רק JSON לפי הסכמה.
`.trim();

/**
 * Converts a value into normalized searchable text.
 *
 * @param {*} value Value to normalize.
 * @return {string} Normalized text.
 */
function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[׳’]/g, "'")
    .replace(/\s+/g, " ");
}

/**
 * Returns the unique identifier of a product.
 *
 * @param {object} product Store product.
 * @return {string|null} Product code.
 */
function getProductCode(product) {
  const code = product?.code || product?.id;

  if (!code) {
    return null;
  }

  return String(code).trim() || null;
}

/**
 * Checks whether a product is active and available.
 *
 * This function applies store facts only.
 * It does not make fashion decisions.
 *
 * @param {object} product Store product.
 * @return {boolean} Whether the product may be recommended.
 */
function isAvailableProduct(product) {
  if (!product || typeof product !== "object") {
    return false;
  }

  if (!getProductCode(product)) {
    return false;
  }

  if (
    product.active === false ||
    product.hidden === true
  ) {
    return false;
  }

  if (
    typeof product.stock === "number"
  ) {
    return product.stock > 0;
  }

  if (Array.isArray(product.variants)) {
    return product.variants.some((variant) => {
      if (
        typeof variant?.stock === "number" &&
        variant.stock > 0
      ) {
        return true;
      }

      const sizes = variant?.sizes;

      if (
        sizes &&
        typeof sizes === "object" &&
        !Array.isArray(sizes)
      ) {
        return Object.values(sizes).some(
          (quantity) => Number(quantity) > 0
        );
      }

      return false;
    });
  }

  return true;
}

/**
 * Checks whether a product can match the requested gender.
 *
 * @param {object} product Store product.
 * @param {string|null} requestedGender Requested department.
 * @return {boolean} Whether the product is eligible.
 */
function matchesGender(product, requestedGender) {
  if (!requestedGender) {
    return true;
  }

  const productGender = normalizeText(product?.gender);

  if (!productGender) {
    return true;
  }

  if (
    productGender.includes("יוניסקס") ||
    productGender.includes("unisex")
  ) {
    return true;
  }

  return productGender.includes(
    normalizeText(requestedGender)
  );
}

/**
 * Checks whether a product fits the requested price limits.
 *
 * @param {object} product Store product.
 * @param {object} intent Detected customer intent.
 * @return {boolean} Whether the price is eligible.
 */
function matchesPrice(product, intent) {
  const price = Number(product?.price);

  if (!Number.isFinite(price)) {
    return true;
  }

  if (
    Number.isFinite(intent?.minPrice) &&
    price < intent.minPrice
  ) {
    return false;
  }

  if (
    Number.isFinite(intent?.maxPrice) &&
    price > intent.maxPrice
  ) {
    return false;
  }

  return true;
}

/**
 * Creates a compact version of a product for Gemini.
 *
 * @param {object} product Store product.
 * @return {object} Compact product data.
 */
function serializeProduct(product) {
  return {
    code: getProductCode(product),
    name: product?.name || null,
    category:
      product?.cat ||
      product?.category ||
      product?.type ||
      null,
    description: product?.desc || null,
    gender: product?.gender || null,
    season: product?.season || null,
    price:
      Number.isFinite(Number(product?.price)) ?
        Number(product.price) :
        null,
    colors: extractColors(product),
    bestseller: product?.bestseller === true,
    trending: product?.trending === true,
  };
}

/**
 * Extracts available colors from a product.
 *
 * @param {object} product Store product.
 * @return {string[]} Product colors.
 */
function extractColors(product) {
  const colors = new Set();

  if (product?.color) {
    colors.add(String(product.color).trim());
  }

  if (Array.isArray(product?.colors)) {
    product.colors.forEach((color) => {
      const value =
        typeof color === "string" ?
          color :
          color?.name || color?.colorName;

      if (value) {
        colors.add(String(value).trim());
      }
    });
  }

  if (Array.isArray(product?.variants)) {
    product.variants.forEach((variant) => {
      const value =
        variant?.colorName ||
        variant?.color ||
        variant?.name;

      if (value) {
        colors.add(String(value).trim());
      }
    });
  }

  return [...colors].filter(Boolean);
}

/**
 * Filters products using factual store constraints.
 *
 * @param {object[]} products Store products.
 * @param {object} intent Detected intent.
 * @return {object[]} Eligible products.
 */
function filterEligibleProducts(products, intent) {
  return products.filter((product) =>
    isAvailableProduct(product) &&
    matchesGender(product, intent?.gender) &&
    matchesPrice(product, intent)
  );
}

/**
 * Extracts JSON from a Gemini response.
 *
 * @param {string} rawText Raw response.
 * @return {object} Parsed JSON object.
 */
function parsePlannerResponse(rawText) {
  const cleanedText = String(rawText || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleanedText.indexOf("{");
  const lastBrace = cleanedText.lastIndexOf("}");

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace < firstBrace
  ) {
    throw new Error(
      "No JSON object found in outfit planner response"
    );
  }

  return JSON.parse(
    cleanedText.slice(firstBrace, lastBrace + 1)
  );
}

/**
 * Validates that Gemini selected real catalog products.
 *
 * @param {object} result Parsed Gemini result.
 * @param {object[]} eligibleProducts Eligible catalog products.
 * @return {object[]} Verified selected products.
 */
function resolveSelectedProducts(
  result,
  eligibleProducts
) {
  const productMap = new Map(
    eligibleProducts.map((product) => [
      normalizeText(getProductCode(product)),
      product,
    ])
  );

  const selectedCodes = Array.isArray(
    result?.selectedProductCodes
  ) ?
    result.selectedProductCodes :
    [];

  const seenCodes = new Set();

  return selectedCodes
    .map((code) => {
      const normalizedCode = normalizeText(code);

      if (
        !normalizedCode ||
        seenCodes.has(normalizedCode)
      ) {
        return null;
      }

      seenCodes.add(normalizedCode);

      return productMap.get(normalizedCode) || null;
    })
    .filter(Boolean)
    .slice(0, 5);
}

/**
 * Uses Gemini to build an outfit from real catalog products.
 *
 * @param {object} options Planner options.
 * @param {object[]} options.products Store products.
 * @param {object} options.intent Detected customer intent.
 * @param {string} options.message Original customer request.
 * @return {Promise<object>} Planned outfit.
 */
async function planOutfit({
  products,
  intent,
  message = "",
}) {
  const safeProducts = Array.isArray(products) ?
    products :
    [];

  const eligibleProducts = filterEligibleProducts(
    safeProducts,
    intent || {}
  );

  if (!eligibleProducts.length) {
    return {
      success: false,
      selectedProducts: [],
      explanation:
        "לא נמצאו מוצרים זמינים שמתאימים לבקשה.",
      candidatesCount: safeProducts.length,
      eligibleCount: 0,
    };
  }

  const catalogForPlanner = eligibleProducts.map(
    serializeProduct
  );

  const plannerRequest = {
    customerMessage: message || null,

    request: {
      occasion: intent?.occasion || null,
      eventTime: intent?.eventTime || null,
      gender: intent?.gender || null,
      style: intent?.style || null,
      season: intent?.season || null,
      color: intent?.color || null,
      minPrice: intent?.minPrice ?? null,
      maxPrice: intent?.maxPrice ?? null,
      outfitType: intent?.outfitType || null,
    },

    products: catalogForPlanner,
  };

  const ai = getGeminiClient();

  const result = await ai.models.generateContent({
    model: MODEL_NAME,

    contents: [
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify(plannerRequest),
          },
        ],
      },
    ],

    config: {
      systemInstruction: PLANNER_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: PLANNER_SCHEMA,
      temperature: 0.3,
      maxOutputTokens: 1024,

      thinkingConfig: {
        thinkingLevel: "minimal",
      },
    },
  });

  const rawText =
    result?.text ||
    result?.candidates?.[0]?.content
      ?.parts?.[0]?.text ||
    "";

  if (!rawText.trim()) {
    throw new Error(
      "Empty response from outfit planner"
    );
  }

  const parsedResult = parsePlannerResponse(rawText);

  const selectedProducts = resolveSelectedProducts(
    parsedResult,
    eligibleProducts
  );

  if (!selectedProducts.length) {
    throw new Error(
      "Outfit planner did not select valid products"
    );
  }

  const explanation =
    String(parsedResult?.explanation || "").trim();

  console.log("OUTFIT PLANNER RESULT:", {
    candidates: safeProducts.length,
    eligible: eligibleProducts.length,
    selected: selectedProducts.map((product) => ({
      code: getProductCode(product),
      name: product?.name || null,
      category:
        product?.cat ||
        product?.category ||
        null,
    })),
    explanation,
  });

  return {
    success: true,
    selectedProducts,
    explanation,
    candidatesCount: safeProducts.length,
    eligibleCount: eligibleProducts.length,
  };
}

module.exports = {
  planOutfit,
};