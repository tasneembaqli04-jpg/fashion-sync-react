const {getGeminiClient} = require("../config/gemini");

const MODEL_NAME = "gemini-3-flash-preview";
const RESPONSE_MODE_VALUES = Object.freeze([
  "TEXT",
  "IMAGE",
]);
const INTENTS = Object.freeze({
  PRODUCT_SEARCH: "PRODUCT_SEARCH",
  PRODUCT_DETAILS: "PRODUCT_DETAILS",
  STOCK_CHECK: "STOCK_CHECK",
  PRICE_CHECK: "PRICE_CHECK",
  SALE_SEARCH: "SALE_SEARCH",
  OUTFIT_RECOMMENDATION: "OUTFIT_RECOMMENDATION",
  OUTFIT_MODIFICATION: "OUTFIT_MODIFICATION",
  STORE_INFO: "STORE_INFO",
  ORDER_STATUS: "ORDER_STATUS",
  LOYALTY_POINTS: "LOYALTY_POINTS",
  COUPONS: "COUPONS",
  CART: "CART",
  GENERAL_CHAT: "GENERAL_CHAT",
});

const INTENT_VALUES = Object.values(INTENTS);

const CATEGORY_VALUES = Object.freeze([
  "שמלות",
  "חולצות",
  "מכנסיים",
  "נעליים",
  "עליוניות",
  "אביזרים",
]);

const GENDER_VALUES = Object.freeze([
  "נשים",
  "גברים",
]);

const OUTFIT_TYPE_VALUES = Object.freeze([
  "SINGLE_PRODUCT",
  "COMPLETE_OUTFIT",
]);
const CONVERSATION_ACTION_VALUES = Object.freeze([
  "CONTINUE",
  "RESET",
  "RELATED_SEARCH",
  "ASK_CHANGE_TARGET",
]);

const INTENT_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: INTENT_VALUES,
    },

    conversationAction: {
      type: "string",
      enum: CONVERSATION_ACTION_VALUES,
    },

    needsClarification: {
      type: "boolean",
    },

    clarificationQuestion: {
      type: ["string", "null"],
    },

    responseMode: {
      type: "string",
      enum: RESPONSE_MODE_VALUES,
    },

    category: {
      type: ["string", "null"],
      enum: [
        ...CATEGORY_VALUES,
        null,
      ],
    },

    productCode: {
      type: ["string", "null"],
    },

    productName: {
      type: ["string", "null"],
    },

    gender: {
      type: ["string", "null"],
      enum: [
        ...GENDER_VALUES,
        null,
      ],
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
        ...OUTFIT_TYPE_VALUES,
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
      minimum: 0,
      maximum: 1,
    },
  },

  required: [
    "intent",
    "conversationAction",
    "needsClarification",
    "clarificationQuestion",
    "responseMode",
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

כללי פלט:
- אל תוסיף משפט פתיחה.
- אל תענה ישירות ללקוח.
- אל תמליץ עדיין על מוצרים.
- אל תשתמש ב-Markdown.
- אל תעטוף את התוצאה ב-\`\`\`json.
- התגובה חייבת להתחיל ב-{ ולהסתיים ב-}.
- אל תוסיף שדות שאינם מופיעים בסכמה.

כללים כלליים:
- חלץ רק מידע שמופיע בבקשת הלקוח או נובע ממנה באופן ברור.
- אם מידע אינו ידוע, החזר null.
- confidence חייב להיות מספר בין 0 ל-1.
- מחיר הוא בשקלים.
- אל תמציא פרטי מוצר, מחיר, מלאי, קופון או הזמנה.
- תקן קוד מוצר לצורה FS-000 כאשר אפשר.
- gender יהיה "נשים", "גברים" או null.

כללי הקשר שיחה:

החזר conversationAction לפי משמעות ההודעה הנוכחית ביחס להיסטוריה.

- CONTINUE:
  כאשר הלקוחה מוסיפה תנאי, הבהרה או פרט לאותו חיפוש.
  לדוגמה:
  "באדום?"
  "עד 300 שקל?"
  "במידה M?"
  "ולגברים?"

- RESET:
  כאשר הלקוחה מתחילה חיפוש חדש שאינו תלוי במוצר או בחיפוש הקודם.
  לדוגמה:
  "עכשיו אני מחפשת נעליים שחורות"
  "עזבי את השמלות, תראי לי תיקים"
  "בואי נחפש משהו אחר"

- RELATED_SEARCH:
  כאשר הלקוחה מחפשת מוצר נוסף שצריך להתאים למוצר או ללוק הקודם.
  לדוגמה:
  "איזה נעליים יתאימו לשמלה הזאת?"
  "תמצאי לי תיק שילך עם הלוק"
  "איזו עליונית מתאימה לזה?"

כאשר conversationAction הוא CONTINUE:
- השתמש בהיסטוריה כדי להשלים שדות חסרים.
- שמור תנאים קודמים שרלוונטיים לחיפוש הנוכחי.

כאשר conversationAction הוא RESET:
- אל תעתיק תנאים מהחיפוש הקודם.
- חלץ רק מידע מההודעה החדשה.
- שדות שלא מופיעים בהודעה החדשה יהיו null או false לפי הסכמה.

כאשר conversationAction הוא RELATED_SEARCH:
- שמור את ההקשר של המוצר או הלוק הקודם לצורך התאמה.
- category צריך לייצג את הקטגוריה החדשה שהלקוחה מחפשת.
- אין להעתיק אוטומטית מידה, צבע או מחיר של המוצר הקודם לקטגוריה החדשה, אלא אם הלקוחה ביקשה זאת במפורש.

כללי שאלת הבהרה:

כאשר הלקוחה מבקשת התאמה, המלצת לוק או מוצר משלים,
אבל לא ברור איזה סוג מוצר היא רוצה למצוא:

- needsClarification יהיה true.
- clarificationQuestion יכיל שאלה אחת קצרה וטבעית בעברית.
- אל תנחש קטגוריית מוצר.
- category יהיה null.
- אל תחזיר את כל הקטלוג.

דוגמה:

הלקוחה:
"יש משהו שמתאים לנעליים השחורות?"

החזר:
intent="OUTFIT_RECOMMENDATION"
conversationAction="RELATED_SEARCH"
needsClarification=true
clarificationQuestion="בשמחה! איזה סוג פריט תרצי להתאים לנעליים השחורות — שמלה, תיק, מכנסיים או לוק מלא?"
category=null

כאשר הלקוחה כבר מציינת את סוג המוצר:

"אני רוצה תיק שיתאים לנעליים השחורות"

החזר:
needsClarification=false
clarificationQuestion=null
category="אביזרים"
productName="תיק"

כאשר הלקוחה עונה על שאלת הבהרה בהודעה קצרה, למשל:
"שמלה"

השתמש בהיסטוריית השיחה כדי להבין שזו תשובה לשאלה הקודמת:
needsClarification=false
conversationAction="RELATED_SEARCH"
category="שמלות"

כללי שינוי לוק קיים:

כאשר הלקוחה מבקשת לשנות לוק שכבר הוצג,
למשל:

- "עוד אפשרות"
- "אפשר לוק אחר?"
- "תראי לי משהו אחר"
- "תחליפי משהו"
- "אני רוצה אפשרות אחרת"

אם לא ברור איזה פריט היא רוצה להחליף:

- intent יהיה OUTFIT_MODIFICATION.
- conversationAction יהיה ASK_CHANGE_TARGET.
- needsClarification יהיה true.
- clarificationQuestion יהיה:
  "בשמחה 😊 מה תרצי להחליף בלוק — את השמלה, הנעליים, התיק, האביזרים או את כל הלוק?"
- שמור מההיסטוריה את gender, occasion, eventTime, season,
  style, outfitType ו-responseMode.
- אין לבחור מוצרים חדשים ואין ליצור תמונה לפני קבלת תשובת הלקוחה.

כאשר הלקוחה מציינת במפורש מה להחליף,
למשל:

- "תחליפי את השמלה"
- "אני רוצה נעליים אחרות"
- "תיק אחר"
- "תשני את האביזרים"
- "תחליפי את כל הלוק"

אז:

- intent יהיה OUTFIT_MODIFICATION.
- conversationAction יהיה CONTINUE.
- needsClarification יהיה false.
- clarificationQuestion יהיה null.
- השתמש בהיסטוריה כדי לשמור את פרטי הלוק הקודם.
- category יהיה בהתאם לפריט המבוקש:
  "שמלה" -> "שמלות"
  "נעליים" -> "נעליים"
  "תיק" או "אביזרים" -> "אביזרים"
- כאשר הלקוחה מבקשת להחליף את כל הלוק,
  category יהיה null,
  outfitType יהיה COMPLETE_OUTFIT.
- אם הלוק הקודם היה תמונה,
  responseMode יישאר IMAGE.

כאשר intent הוא OUTFIT_RECOMMENDATION
ו-outfitType הוא COMPLETE_OUTFIT:

- אם gender אינו ידוע, אסור לבחור מגדר לבד.
- needsClarification חייב להיות true.
- clarificationQuestion חייב להיות:
  "הלוק מיועד לאישה או לגבר?"
- gender יהיה null.
- אין ליצור עדיין תמונה או לבחור מוצרים לפני קבלת תשובת הלקוחה.

כאשר הלקוחה עונה לאחר מכן תשובה קצרה כמו:
"לאישה"
"נשים"
"לגבר"
"גברים"

- השתמש בהיסטוריית השיחה כדי להשלים את הבקשה הקודמת.
- conversationAction יהיה CONTINUE.
- needsClarification יהיה false.
- clarificationQuestion יהיה null.
- שמור את occasion, responseMode, outfitType וכל שאר התנאים מהבקשה הקודמת.
- gender יהיה "נשים" או "גברים" בהתאם לתשובה.

- אם הבקשה המקורית הייתה לקבל תמונה או המחשה חזותית,
  שמור responseMode="IMAGE" גם לאחר תשובת ההבהרה.

- אם הבקשה המקורית הייתה ללוק מלא,
  שמור outfitType="COMPLETE_OUTFIT" גם לאחר תשובת ההבהרה.

אם אין היסטוריה קודמת:
- conversationAction יהיה RESET.



כללי קטגוריות:
- category יהיה רק אחד מהערכים הבאים:
  "שמלות", "חולצות", "מכנסיים",
  "נעליים", "עליוניות", "אביזרים" או null.
- תמיד המר את הביטוי של הלקוח לערך הקטגוריה התקני של הקטלוג.
- אל תחזיר category בלשון יחיד.
- אל תחזיר קטגוריה שאינה נמצאת ברשימה.
- אם לא ניתן לקבוע קטגוריה, החזר null.

כללי סוג תגובה:

- responseMode יהיה "IMAGE" כאשר הלקוחה מבקשת במפורש
  תמונה, הדמיה או המחשה חזותית של לוק או של כמה פריטים יחד.

- התמונה המבוקשת היא המחשה של הלוק על דמות גנרית שנוצרת על ידי AI.
- אין צורך בתמונה של הלקוחה.
- אין לפרש בקשת IMAGE כבקשת Virtual Try-On.
- כאשר הלקוחה מבקשת לראות לוק מלא על דמות,
  outfitType יהיה COMPLETE_OUTFIT.

דוגמאות:
"תראי לי תמונה של כל הלוק"
"אפשר לראות איך הפריטים נראים יחד?"
"תייצרי לי המחשה של ההופעה"
"אני רוצה תמונה של הלוק המלא"

במקרים כאלה:
- intent יהיה OUTFIT_RECOMMENDATION.
- responseMode יהיה "IMAGE".
- conversationAction יהיה RELATED_SEARCH כאשר הבקשה קשורה ללוק קודם.
- אל תטען שאין אפשרות להחזיר תמונה.
- אם חסר מידע מהותי לבניית הלוק,
  needsClarification יהיה true ושאל שאלה קצרה אחת.

- בכל בקשה שאינה מבקשת תמונה או המחשה חזותית,
  responseMode יהיה "TEXT".

דוגמאות להמרת קטגוריה:
- "שמלה", "שמלת ערב", "שמלת קיץ" -> "שמלות".
- "חולצה", "חולצת טי", "חולצת פולו" -> "חולצות".
- "מכנס", "מכנסי ג'ינס", "ג'ינס" -> "מכנסיים".
- "נעל", "סניקרס", "מגף", "סנדל" -> "נעליים".
- "מעיל", "ז'קט", "ג'קט", "קפוצ'ון",
  "סווטשירט", "עליונית" -> "עליוניות".
- "תיק", "ארנק", "שרשרת", "חגורה", "כובע",
  "משקפיים", "שעון", "צעיף" -> "אביזרים".

כללי כוונה:
- אם הלקוח שואל האם מוצר, קטגוריה, מידה או צבע
  קיימים או זמינים במלאי:
  intent יהיה STOCK_CHECK
  ו-inStockOnly יהיה true.

- אם הלקוח מבקש לראות או למצוא מוצרים לפי קטגוריה,
  צבע, מידה או טווח מחיר, בלי לשאול אם הם קיימים:
  intent יהיה PRODUCT_SEARCH.

- אם הלקוח שואל על מחיר של מוצר מסוים:
  intent יהיה PRICE_CHECK.

- אם הלקוח שואל על מידע או פרטים של מוצר מסוים:
  intent יהיה PRODUCT_DETAILS.

- אם הלקוח מחפש מבצעים או מוצרים בהנחה:
  intent יהיה SALE_SEARCH
  ו-saleOnly יהיה true.

- אם הלקוח מבקש המלצה לפי אירוע, סגנון או לוק:
  intent יהיה OUTFIT_RECOMMENDATION.

- שאלות על חתונה, מסיבה, עבודה, ראיון, דייט,
  חופשה, לימודים או אירוע אחר חייבות לכלול occasion.

- eventTime יכול להיות למשל:
  "בוקר", "צהריים", "ערב" או null.

כללי outfitType:
- outfitType יהיה COMPLETE_OUTFIT כאשר הלקוח מבקש:
  לוק, הופעה מלאה או כמה פריטים שמתאימים יחד.

- outfitType יהיה SINGLE_PRODUCT כאשר הלקוח מחפש:
  מוצר אחד, קטגוריה אחת או פריט מסוים.

- כאשר outfitType אינו רלוונטי, החזר null.

דוגמאות:
- "יש שמלה במידה M?"
  intent: STOCK_CHECK
  category: "שמלות"
  size: "M"
  inStockOnly: true
  outfitType: SINGLE_PRODUCT

- "תראי לי שמלות במידה M"
  intent: PRODUCT_SEARCH
  category: "שמלות"
  size: "M"
  inStockOnly: false
  outfitType: SINGLE_PRODUCT

- "יש ג'ינס לגברים?"
  intent: STOCK_CHECK
  category: "מכנסיים"
  gender: "גברים"
  inStockOnly: true
  outfitType: SINGLE_PRODUCT

- "אני צריכה לוק לחתונה בערב"
  intent: OUTFIT_RECOMMENDATION
  occasion: "חתונה"
  eventTime: "ערב"
  outfitType: COMPLETE_OUTFIT

- "תראי לי איך כל הלוק נראה"
  intent: OUTFIT_RECOMMENDATION
  conversationAction: RESET
  responseMode: IMAGE
  outfitType: COMPLETE_OUTFIT
  needsClarification: false
`.trim();

/**
 * Converts a nullable value into a safe string.
 *
 * @param {*} value Value to normalize.
 * @return {string|null} Normalized string or null.
 */
function normalizeNullableString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalizedValue = String(value).trim();

  return normalizedValue || null;
}

/**
 * Converts a nullable value into a valid number.
 *
 * @param {*} value Value to normalize.
 * @return {number|null} Normalized number or null.
 */
function normalizeNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

/**
 * Extracts the JSON object from a model response.
 *
 * @param {string} rawText Raw Gemini response.
 * @return {string} Extracted JSON text.
 */
function extractJsonText(rawText) {
  const cleanedText = String(rawText || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBraceIndex = cleanedText.indexOf("{");
  const lastBraceIndex = cleanedText.lastIndexOf("}");

  if (
    firstBraceIndex === -1 ||
    lastBraceIndex === -1 ||
    lastBraceIndex < firstBraceIndex
  ) {
    throw new Error("No JSON object found in Gemini response");
  }

  return cleanedText.slice(
    firstBraceIndex,
    lastBraceIndex + 1
  );
}

/**
 * Validates a value against a fixed list.
 *
 * @param {*} value Value returned by Gemini.
 * @param {string[]} allowedValues Allowed values.
 * @return {string|null} Valid value or null.
 */
function normalizeEnumValue(value, allowedValues) {
  const normalizedValue = normalizeNullableString(value);

  if (
    normalizedValue &&
    allowedValues.includes(normalizedValue)
  ) {
    return normalizedValue;
  }

  return null;
}

/**
 * Normalizes a clothing size.
 *
 * @param {*} value Size returned by Gemini.
 * @return {string|null} Normalized size.
 */
function normalizeSize(value) {
  const normalizedValue = normalizeNullableString(value);

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.toUpperCase();
}

/**
 * Normalizes a product code.
 *
 * @param {*} value Product code returned by Gemini.
 * @return {string|null} Normalized product code.
 */
function normalizeProductCode(value) {
  const normalizedValue = normalizeNullableString(value);

  if (!normalizedValue) {
    return null;
  }

  const upperValue = normalizedValue.toUpperCase();
  const digits = upperValue.match(/\d+/)?.[0];

  if (!digits) {
    return upperValue;
  }

  return `FS-${digits.padStart(3, "0")}`;
}

/**
 * Validates and normalizes the parsed intent.
 *
 * @param {object} parsed Parsed Gemini output.
 * @return {object} Safe normalized intent.
 */
function normalizeIntent(parsed) {
  const normalizedIntent =
    INTENT_VALUES.includes(parsed?.intent) ?
      parsed.intent :
      INTENTS.GENERAL_CHAT;

  const confidence = Number(parsed?.confidence);

  return {
    intent: normalizedIntent,
    conversationAction:
      normalizeEnumValue(
      parsed?.conversationAction,
      CONVERSATION_ACTION_VALUES
    ) || "RESET",

    needsClarification:
      parsed?.needsClarification === true,

    clarificationQuestion:
      parsed?.needsClarification === true
        ? normalizeNullableString(
        parsed?.clarificationQuestion
      )
      : null,

    responseMode:
      normalizeEnumValue(
      parsed?.responseMode,
      RESPONSE_MODE_VALUES
    ) || "TEXT",

    category: normalizeEnumValue(
      parsed?.category,
      CATEGORY_VALUES
    ),

    productCode: normalizeProductCode(
      parsed?.productCode
    ),

    productName: normalizeNullableString(
      parsed?.productName
    ),

    gender: normalizeEnumValue(
      parsed?.gender,
      GENDER_VALUES
    ),

    size: normalizeSize(parsed?.size),

    color: normalizeNullableString(
      parsed?.color
    ),

    minPrice: normalizeNullableNumber(
      parsed?.minPrice
    ),

    maxPrice: normalizeNullableNumber(
      parsed?.maxPrice
    ),

    occasion: normalizeNullableString(
      parsed?.occasion
    ),

    eventTime: normalizeNullableString(
      parsed?.eventTime
    ),

    season: normalizeNullableString(
      parsed?.season
    ),

    style: normalizeNullableString(
      parsed?.style
    ),

    outfitType: normalizeEnumValue(
      parsed?.outfitType,
      OUTFIT_TYPE_VALUES
    ),

    saleOnly: Boolean(parsed?.saleOnly),

    inStockOnly: Boolean(parsed?.inStockOnly),

    confidence: Number.isFinite(confidence) ?
      Math.min(Math.max(confidence, 0), 1) :
      0,
  };
}

/**
 * Converts conversation history into Gemini contents.
 *
 * @param {Array} history Previous conversation turns.
 * @param {string} message Current customer message.
 * @return {Array} Gemini contents.
 */
function buildContents(history, message) {
  const safeHistory = Array.isArray(history) ?
    history
      .filter((turn) =>
        turn &&
        typeof turn.text === "string" &&
        turn.text.trim()
      )
      .slice(-8) :
    [];

  return [
    ...safeHistory.map((turn) => ({
      role:
        turn.role === "bot" ||
        turn.role === "model" ?
          "model" :
          "user",

      parts: [
        {
          text: turn.text.trim(),
        },
      ],
    })),

    {
      role: "user",
      parts: [
        {
          text: message.trim(),
        },
      ],
    },
  ];
}

/**
 * Uses Gemini to classify the customer request.
 *
 * @param {object} options Classification options.
 * @param {string} options.message Customer message.
 * @param {Array} options.history Previous conversation turns.
 * @return {Promise<object>} Structured customer intent.
 */
async function detectChatIntent({
  message,
  history = [],
}) {
  if (
    !message ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    throw new Error("Message is required");
  }

  const ai = getGeminiClient();
  const contents = buildContents(history, message);

  const result = await ai.models.generateContent({
    model: MODEL_NAME,
    contents,

    config: {
      systemInstruction: INTENT_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: INTENT_SCHEMA,
      temperature: 0,
      maxOutputTokens: 1024,

      thinkingConfig: {
        thinkingLevel: "minimal",
      },
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
    const jsonText = extractJsonText(rawText);
    parsed = JSON.parse(jsonText);
  } catch (error) {
    console.error("Invalid intent JSON:", rawText);
    console.error(
      "Intent parsing error:",
      error?.message || error
    );

    throw new Error(
      "Invalid intent response from Gemini"
    );
  }

  const normalizedIntent = normalizeIntent(parsed);
  return normalizedIntent;
}

module.exports = {
  INTENTS,
  detectChatIntent,
};