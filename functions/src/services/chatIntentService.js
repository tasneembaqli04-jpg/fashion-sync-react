const {ai} = require("../config/gemini");

const MODEL_NAME = "gemini-flash-latest";

const INTENTS = Object.freeze({
  PRODUCT_SEARCH: "PRODUCT_SEARCH",
  PRODUCT_DETAILS: "PRODUCT_DETAILS",
  STOCK_CHECK: "STOCK_CHECK",
  PRICE_CHECK: "PRICE_CHECK",
  SALE_SEARCH: "SALE_SEARCH",
  OUTFIT_RECOMMENDATION: "OUTFIT_RECOMMENDATION",
  STORE_INFO: "STORE_INFO",
  ORDER_STATUS: "ORDER_STATUS",
  LOYALTY_POINTS: "LOYALTY_POINTS",
  COUPONS: "COUPONS",
  CART: "CART",
  GENERAL_CHAT: "GENERAL_CHAT",
});

const INTENT_VALUES = Object.values(INTENTS);

const INTENT_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: INTENT_VALUES,
    },
    category: {
      type: ["string", "null"],
    },
    productCode: {
      type: ["string", "null"],
    },
    productName: {
      type: ["string", "null"],
    },
    gender: {
      type: ["string", "null"],
    },
    size: {
      type: ["string", "null"],
    },
    color: {
      type: ["string", "null"],
    },
    minPrice: {
      type: ["number", "null"],
    },
    maxPrice: {
      type: ["number", "null"],
    },
    occasion: {
      type: ["string", "null"],
    },
    eventTime: {
      type: ["string", "null"],
    },
    season: {
      type: ["string", "null"],
    },
    style: {
      type: ["string", "null"],
    },
    outfitType: {
      type: ["string", "null"],
      enum: [
        "SINGLE_PRODUCT",
        "COMPLETE_OUTFIT",
        null,
      ],
    },
    saleOnly: {
      type: "boolean",
    },
    inStockOnly: {
      type: "boolean",
    },
    confidence: {
      type: "number",
    },
  },
  required: [
    "intent",
    "category",
    "productCode",
    "productName",
    "gender",
    "size",
    "color",
    "minPrice",
    "maxPrice",
    "occasion",
    "eventTime",
    "season",
    "style",
    "outfitType",
    "saleOnly",
    "inStockOnly",
    "confidence",
  ],
};

const INTENT_INSTRUCTION = `
אתה מנתח בקשות של לקוחות בחנות האופנה FashionSync.

החזר אך ורק מידע מובנה לפי הסכמה שסופקה.

כללים:
- אל תענה ללקוח ואל תמליץ עדיין על מוצרים.
- חלץ רק מידע שמופיע בבקשה או נובע ממנה באופן ברור.
- אם מידע אינו ידוע, החזר null.
- confidence חייב להיות מספר בין 0 ל-1.
- מחיר הוא בשקלים.
- תקן קוד מוצר לצורה FS-000 כאשר אפשר.
- gender יהיה "נשים", "גברים" או null.
- eventTime יכול להיות למשל "בוקר", "צהריים", "ערב" או null.
- outfitType יהיה COMPLETE_OUTFIT כאשר הלקוח מבקש לוק,
  הופעה או כמה פריטים מתאימים יחד.
- outfitType יהיה SINGLE_PRODUCT כאשר הוא מחפש פריט מסוים.
- שאלות על חתונה, מסיבה, עבודה, ראיון, דייט, חופשה,
  לימודים או אירוע אחר חייבות לכלול occasion.
- אם הלקוח מבקש המלצה לפי אירוע או סגנון,
  השתמש ב-OUTFIT_RECOMMENDATION.
- אם הוא רק מחפש קטגוריה, צבע, מידה או מחיר,
  השתמש ב-PRODUCT_SEARCH.
- אל תמציא פרטי מוצר, מחיר, מלאי או הזמנה.
`.trim();

/**
 * Validates and normalizes the parsed intent.
 *
 * @param {object} parsed Parsed Gemini output.
 * @return {object} Safe normalized intent.
 */
function normalizeIntent(parsed) {
  const intent = INTENT_VALUES.includes(parsed?.intent) ?
    parsed.intent :
    INTENTS.GENERAL_CHAT;

  const confidence = Number(parsed?.confidence);

  return {
    intent,
    category: parsed?.category || null,
    productCode: parsed?.productCode || null,
    productName: parsed?.productName || null,
    gender: parsed?.gender || null,
    size: parsed?.size || null,
    color: parsed?.color || null,
    minPrice: Number.isFinite(Number(parsed?.minPrice)) ?
      Number(parsed.minPrice) :
      null,
    maxPrice: Number.isFinite(Number(parsed?.maxPrice)) ?
      Number(parsed.maxPrice) :
      null,
    occasion: parsed?.occasion || null,
    eventTime: parsed?.eventTime || null,
    season: parsed?.season || null,
    style: parsed?.style || null,
    outfitType: parsed?.outfitType || null,
    saleOnly: Boolean(parsed?.saleOnly),
    inStockOnly: Boolean(parsed?.inStockOnly),
    confidence: Number.isFinite(confidence) ?
      Math.min(Math.max(confidence, 0), 1) :
      0,
  };
}

/**
 * Uses Gemini to classify the customer request.
 *
 * @param {object} options Classification options.
 * @param {string} options.message Customer message.
 * @return {Promise<object>} Structured customer intent.
 */
async function detectChatIntent({message}) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required");
  }

  const result = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: message.trim(),
          },
        ],
      },
    ],
    config: {
      systemInstruction: INTENT_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: INTENT_SCHEMA,
      temperature: 0.1,
      maxOutputTokens: 350,
    },
  });

  const rawText =
    result?.text ||
    result?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";

  if (!rawText.trim()) {
    throw new Error("Empty intent response from Gemini");
  }

  let parsed;

  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    console.error("Invalid intent JSON:", rawText);
    throw new Error("Invalid intent response from Gemini");
  }

  return normalizeIntent(parsed);
}

module.exports = {
  INTENTS,
  detectChatIntent,
};