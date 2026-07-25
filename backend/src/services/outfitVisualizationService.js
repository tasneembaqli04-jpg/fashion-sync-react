const { getGeminiClient } = require("../config/gemini");

const IMAGE_MODEL_NAME = "gemini-3.1-flash-image";
const MAX_REFERENCE_IMAGES = 6;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Builds a readable catalog description for one product.
 *
 * @param {object} product Catalog product.
 * @param {number} index Product position.
 * @return {string} Product description.
 */
function buildProductDescription(product, index) {
  const colors =
    Array.isArray(product.colors) && product.colors.length
      ? product.colors.join(", ")
      : "לא צוינו";

  return `
פריט ${index + 1}:
שם: ${product.name || "לא ידוע"}
קוד: ${product.code || "לא ידוע"}
קטגוריה: ${product.category || "לא ידועה"}
צבעים: ${colors}
צבע שנבחר להצגה: ${product.selectedColor || "לא צוין"}
פעולה בלוק: ${product.action || "לא צוינה"}
תיאור: ${product.description || "ללא תיאור"}
`.trim();
}

/**
 * Creates a compact readable summary of one outfit product.
 *
 * @param {object} product Outfit product.
 * @return {object} Safe product summary.
 */
function buildOutfitProductSummary(product) {
  return {
    code: product?.code || "",
    name: product?.name || "",
    category: product?.category || product?.cat || "",

    colors: Array.isArray(product?.colors) ? product.colors : [],

    selectedColor: product?.selectedColor || null,

    action: product?.action || null,
  };
}

/**
 * Builds explicit decisions for the image-generation model.
 *
 * This does not call Gemini. It converts the existing structured
 * intent and planner result into clear visualization instructions.
 *
 * @param {object} options Decision options.
 * @param {string} options.originalMessage Current customer message.
 * @param {object} options.intent Structured intent.
 * @param {object} options.outfitPlan Planner result.
 * @param {object[]} options.currentOutfit Previous outfit.
 * @param {string} options.currentOutfitImage Previous generated outfit Data URL.
 * @param {object[]} options.products Selected products.
 * @return {string} Explicit visualization decisions.
 */
function buildVisualizationDecisionSummary({
  originalMessage = "",
  intent = {},
  outfitPlan = null,
  currentOutfit = [],
  products = [],
}) {
  const previousProducts = Array.isArray(currentOutfit)
    ? currentOutfit.map(buildOutfitProductSummary)
    : [];

  const selectedProducts = Array.isArray(products)
    ? products.map(buildOutfitProductSummary)
    : [];

  const requestedCategory = intent.category || intent.productCategory || "";

  const requestedColor = intent.color || "";

  const requestedStyle = intent.style || "";

  const requestedOccasion = intent.occasion || "";

  const plannerExplanation = outfitPlan?.explanation || "";

  const hasPreviousOutfit = previousProducts.length > 0;

  return `
החלטות מחייבות ליצירת התמונה:

בקשת הלקוחה:
${originalMessage || "לא נמסרה בקשה מפורשת"}

הפריט או הקטגוריה המבוקשים:
${requestedCategory || "לא צוינו"}

הצבע המבוקש:
${requestedColor || "לא צוין"}

הסגנון המבוקש:
${requestedStyle || "לא צוין"}

האירוע:
${requestedOccasion || "לא צוין"}

החלטת מתכנן הלוק:
${plannerExplanation || "לא נמסרה החלטה מילולית"}

האם קיים לוק קודם:
${hasPreviousOutfit ? "כן" : "לא"}

פריטי הלוק הקודם:
${JSON.stringify(previousProducts, null, 2)}

הפריטים שנבחרו לתמונה החדשה:
${JSON.stringify(selectedProducts, null, 2)}

כללי ביצוע:
- יש להציג את הפריטים שנבחרו לתמונה החדשה.
- אם הלקוחה ביקשה לשנות פריט אחד בלבד, יש לשמור על יתר פריטי הלוק הקודם.
- אם צוין צבע מבוקש, יש להחיל אותו רק על הפריט הרלוונטי.
- אין לשנות צבע של פריטים אחרים ללא בקשה מפורשת.
- אין להחליף מוצר שנבחר במוצר אחר.
- אין להוסיף פריט לבוש מרכזי שלא נבחר על ידי המתכנן.
- יש לשמור על עיצוב המוצר לפי תמונת הייחוס.
`.trim();
}

/**
 * Builds the full context used for outfit visualization.
 *
 * @param {object} options Context options.
 * @param {string} options.originalMessage Current customer message.
 * @param {object[]} options.history Recent conversation history.
 * @param {object} options.intent Structured intent.
 * @param {object} options.outfitPlan Planner result.
 * @param {object[]} options.currentOutfit Previous outfit.
 * @param {object[]} options.products Selected catalog products.
 * @return {string} Visualization context.
 */
function buildVisualizationContext({
  originalMessage = "",
  history = [],
  intent = {},
  outfitPlan = null,
  currentOutfit = [],
  products = [],
}) {
  const recentHistory = Array.isArray(history) ? history.slice(-6) : [];

  const previousOutfit = Array.isArray(currentOutfit)
    ? currentOutfit.map(buildOutfitProductSummary)
    : [];

  const selectedProducts = Array.isArray(products)
    ? products.map(buildOutfitProductSummary)
    : [];

  const visualizationDecisions = buildVisualizationDecisionSummary({
    originalMessage,
    intent,
    outfitPlan,
    currentOutfit,
    products,
  });

  return `
החלטות מפורשות ליצירת התמונה:
${visualizationDecisions}

הודעת הלקוחה הנוכחית:
${originalMessage || "לא נמסרה"}

היסטוריית שיחה אחרונה:
${JSON.stringify(recentHistory, null, 2)}

הכוונה שזוהתה:
${JSON.stringify(intent, null, 2)}

החלטת מתכנן הלוק:
${JSON.stringify(
  {
    explanation: outfitPlan?.explanation || "",
    selectedProducts,
  },
  null,
  2,
)}

הלוק הקודם:
${JSON.stringify(previousOutfit, null, 2)}

הלוק שנבחר להצגה:
${JSON.stringify(selectedProducts, null, 2)}
`.trim();
}

/**
 * Builds the image-generation prompt.
 *
 * @param {object} options Prompt options.
 * @param {string} options.visualizationContext Full request context.
 * @param {object} options.intent Structured intent.
 * @param {object[]} options.products Selected products.
 * @return {string} Image prompt.
 */
function buildVisualizationPrompt({ visualizationContext, intent, products }) {
  const productDescriptions = products
    .map(buildProductDescription)
    .join("\n\n");

  return `
צור תמונת אופנה ריאליסטית ואיכותית של דמות אנושית גנרית שנוצרה באמצעות AI.

הדמות אינה הלקוחה ואינה מבוססת על אדם אמיתי.

המטרה:
להציג את פריטי FashionSync כלוק אחד שלם, מסחרי והרמוני,
בהתאם לבקשת הלקוחה ולהחלטת מתכנן הלוק.

הקשר מלא:
${visualizationContext}

פרטי הבקשה המרכזיים:
קהל יעד: ${intent.gender || "לא צוין"}
אירוע: ${intent.occasion || "לא צוין"}
זמן האירוע: ${intent.eventTime || "לא צוין"}
עונה: ${intent.season || "לא צוינה"}
סגנון: ${intent.style || "לא צוין"}
צבע מבוקש: ${intent.color || "לא צוין"}

פריטי הקטלוג שנבחרו:
${productDescriptions}

סדר עדיפויות להבנת הבקשה:
1. פעל לפי ההודעה הנוכחית של הלקוחה.
2. פעל לפי החלטת מתכנן הלוק.
3. שמור על פריטים מהלוק הקודם שלא התבקש לשנות.
4. השתמש בפרטי ה-Intent כדי להבין צבע, אירוע, עונה וסגנון.
5. השתמש בתמונות הייחוס כדי לשמור על העיצוב המדויק של המוצרים.

כללי שינוי:
- כאשר הלקוחה ביקשה לשנות רק פריט מסוים, אל תשנה את שאר הלוק.
- כאשר הלקוחה ביקשה צבע מסוים, הצג את המוצר בצבע המבוקש,
  בתנאי שהצבע מופיע בפרטי המוצר או בהחלטת מתכנן הלוק.
- כאשר אין בקשת שינוי מפורשת, שמור על צבעי תמונות הייחוס.
- אל תחליף מוצר שנבחר במוצר אחר.
- אל תוסיף מוצר מרכזי שלא נבחר על ידי מתכנן הלוק.
- כאשר יש לוק קודם, שמור על המשכיות חזותית ככל האפשר.
- אם קיים ספק, העדף את החלטת מתכנן הלוק על פני ניחוש.

הוראות חזותיות מחייבות:
- תמונות המוצרים המצורפות הן תמונות ייחוס מחייבות לעיצוב המוצר.
- כל תמונת ייחוס מתאימה לפריט המתואר מיד לפניה.
- הצג דמות אחת בלבד.
- הצג צילום מלא מכף רגל ועד ראש.
- הלבש את הדמות בפריטים שסופקו בלבד ככל האפשר.
- שמור במדויק ככל האפשר על הגזרה והמבנה של כל מוצר.
- שמור על קו הכתפיים, הצווארון, השרוולים והאורך.
- שמור על מלמלות, תחרה, קישוטים, אבזמים ופרטים מיוחדים.
- שמור על הבד, המרקם והצללית של המוצרים.
- אל תחליף מוצר בעיצוב כללי או במוצר דומה.
- אל תשנה שמלה עם מלמלות לשמלה חלקה.
- אם סופקה שמלה, היא תהיה פריט הלבוש המרכזי בתמונה.
- התאם את הנעליים, התיק והאביזרים לפי תמונות הייחוס שלהם.
- השתמש במראה טבעי, מכובד ומסחרי.
- אל תוסיף טקסט, מחיר, קוד מוצר או לוגו לתמונה.
- אל תיצור קולאז׳ או כמה תמונות.
- השתמש ברקע סטודיו נקי ועדין.

לפני יצירת התמונה:
- זהה מה הלקוחה ביקשה לשנות.
- זהה אילו פריטים חייבים להישאר ללא שינוי.
- ודא שהתמונה הסופית תואמת להחלטת מתכנן הלוק.
`.trim();
}

/**
 * Normalizes an image MIME type.
 *
 * @param {string} mimeType Response content type.
 * @param {string} imageUrl Original image URL.
 * @return {string} Supported MIME type.
 */
function normalizeImageMimeType(mimeType, imageUrl) {
  const normalizedMimeType = String(mimeType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (
    normalizedMimeType === "image/jpeg" ||
    normalizedMimeType === "image/png" ||
    normalizedMimeType === "image/webp"
  ) {
    return normalizedMimeType;
  }

  const normalizedUrl = String(imageUrl || "").toLowerCase();

  if (normalizedUrl.includes(".jpg") || normalizedUrl.includes(".jpeg")) {
    return "image/jpeg";
  }

  if (normalizedUrl.includes(".webp")) {
    return "image/webp";
  }

  return "image/png";
}

/**
 * Converts a Data URL image into Gemini inlineData.
 *
 * @param {string} dataUrl Image Data URL.
 * @return {object|null} Gemini inline image part.
 */
function convertDataUrlToInlineData(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") {
    return null;
  }

  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i);

  if (!match) {
    throw new Error("Current outfit image must be a valid image Data URL");
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2];

  const imageBuffer = Buffer.from(base64Data, "base64");

  if (!imageBuffer.length) {
    throw new Error("Current outfit image is empty");
  }

  if (imageBuffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Current outfit image is larger than the allowed limit");
  }

  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
}

/**
 * Downloads a catalog image and converts it to inline data.
 *
 * @param {string} imageUrl Public catalog image URL.
 * @return {Promise<object>} Gemini inline image data.
 */
async function downloadImageAsInlineData(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("Product image URL is missing");
  }

  const response = await fetch(imageUrl, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to download product image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  if (!arrayBuffer.byteLength) {
    throw new Error("Downloaded product image is empty");
  }

  if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Product image is larger than the allowed limit");
  }

  const mimeType = normalizeImageMimeType(
    response.headers.get("content-type"),
    imageUrl,
  );

  return {
    inlineData: {
      mimeType,
      data: Buffer.from(arrayBuffer).toString("base64"),
    },
  };
}

/**
 * Creates Gemini parts containing the product label and image.
 *
 * @param {object[]} products Selected products.
 * @return {Promise<object[]>} Multimodal Gemini parts.
 */
async function buildReferenceImageParts(products) {
  const productsWithImages = products
    .filter((product) => Boolean(product?.imageUrl))
    .slice(0, MAX_REFERENCE_IMAGES);

  const settledResults = await Promise.allSettled(
    productsWithImages.map(async (product, index) => {
      const imagePart = await downloadImageAsInlineData(product.imageUrl);

      return [
        {
          text: `
תמונת ייחוס לפריט ${index + 1}:
${product.name || "מוצר ללא שם"}
קוד מוצר: ${product.code || "לא ידוע"}
קטגוריה: ${product.category || "לא ידועה"}
צבע מחייב להצגה: ${product.selectedColor || "לפי תמונת הייחוס"}
פעולה בלוק: ${product.action || "לא צוינה"}

יש לשמור על העיצוב החזותי של מוצר זה.
אם צוין צבע מחייב, יש לשנות רק את צבע המוצר לצבע זה,
גם כאשר תמונת הייחוס מציגה צבע אחר.
`.trim(),
        },
        imagePart,
      ];
    }),
  );

  const parts = [];

  settledResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      parts.push(...result.value);
      return;
    }

    console.warn("PRODUCT REFERENCE IMAGE DOWNLOAD FAILED:", {
      product:
        productsWithImages[index]?.code ||
        productsWithImages[index]?.name ||
        null,
      error: result.reason?.message || String(result.reason),
    });
  });

  return parts;
}

/**
 * Generates an outfit visualization image.
 *
 * @param {object} options Generation options.
 * @param {string} options.originalMessage Current customer message.
 * @param {object[]} options.history Recent conversation history.
 * @param {object} options.intent Structured customer intent.
 * @param {object} options.outfitPlan Planner result.
 * @param {object[]} options.currentOutfit Previous outfit.
 * @param {object[]} options.products Selected catalog products.
 * @return {Promise<object>} Generated image.
 */
async function generateOutfitVisualization({
  originalMessage = "",
  history = [],
  intent = {},
  outfitPlan = null,
  currentOutfit = [],
  currentOutfitImage = "",
  products = [],
}) {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error(
      "At least one product is required for outfit visualization",
    );
  }

  const ai = getGeminiClient();
  const baseOutfitImagePart = convertDataUrlToInlineData(currentOutfitImage);

  console.log("BASE OUTFIT IMAGE:", {
    exists: Boolean(baseOutfitImagePart),

    mimeType: baseOutfitImagePart?.inlineData?.mimeType || null,

    size: baseOutfitImagePart?.inlineData?.data?.length || 0,
  });

  const visualizationContext = buildVisualizationContext({
    originalMessage,
    history,
    intent,
    outfitPlan,
    currentOutfit,
    products,
  });

  console.log("OUTFIT VISUALIZATION CONTEXT:", visualizationContext);

  const baseImageInstruction = baseOutfitImagePart
    ? `
מצורפת תחילה תמונת הלוק הקודם.

זוהי תמונת הבסיס המחייבת לעריכה:
- יש לערוך את התמונה הקיימת ולא ליצור לוק חדש מאפס.
- יש לשמור על אותה דמות, תנוחה, רקע והרכב חזותי ככל האפשר.
- יש לשנות רק את הפריט שהלקוחה ביקשה לשנות.
- יש להשאיר את יתר פריטי הלוק כפי שהם מופיעים בתמונת הבסיס.
- תמונות המוצרים שמצורפות לאחר מכן הן תמונות ייחוס לפריטים החדשים או המעודכנים.
`
    : "";

  const prompt = `
${baseImageInstruction}

${buildVisualizationPrompt({
  visualizationContext,
  intent,
  products,
})}
`.trim();

  const referenceImageParts = await buildReferenceImageParts(products);

  if (!referenceImageParts.length) {
    console.warn(
      "No product reference images were downloaded; generating from text only",
    );
  }

  console.log(
    "OUTFIT REFERENCE IMAGES:",
    referenceImageParts.filter((part) => part?.inlineData).length,
  );

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL_NAME,

    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },

          ...(baseOutfitImagePart
            ? [
                {
                  text: `
 זוהי תמונת הלוק הקודם.
  יש לערוך אותה בלבד.
  `.trim(),
                },
                baseOutfitImagePart,
              ]
            : []),

          ...referenceImageParts,
        ],
      },
    ],

    config: {
      responseModalities: ["IMAGE"],

      responseFormat: {
        image: {
          aspectRatio: "3:4",
          imageSize: "1K",
        },
      },
    },
  });

  const parts = response?.candidates?.[0]?.content?.parts || [];

  const imagePart = parts.find((part) => part?.inlineData?.data);

  if (!imagePart) {
    throw new Error("Gemini did not return an outfit image");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";

  const base64 = imagePart.inlineData.data;

  return {
    success: true,
    mimeType,
    base64,
    dataUrl: `data:${mimeType};base64,${base64}`,
  };
}

module.exports = {
  generateOutfitVisualization,
};
