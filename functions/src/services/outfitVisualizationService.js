const {getGeminiClient} = require("../config/gemini");

const IMAGE_MODEL_NAME = "gemini-3.1-flash-image";

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
תיאור: ${product.description || "ללא תיאור"}
`.trim();
}

/**
 * Builds the image-generation prompt.
 *
 * @param {object} options Prompt options.
 * @param {object} options.intent Structured intent.
 * @param {object[]} options.products Selected products.
 * @return {string} Image prompt.
 */
function buildVisualizationPrompt({
  intent,
  products,
}) {
  const productDescriptions = products
    .map(buildProductDescription)
    .join("\n\n");

  return `
צור תמונת אופנה ריאליסטית ואיכותית של דמות אנושית גנרית שנוצרה באמצעות AI.

הדמות אינה הלקוחה ואינה מבוססת על אדם אמיתי.

המטרה:
להמחיש את פריטי FashionSync הבאים כלוק אחד שלם והרמוני.

פרטי הבקשה:
קהל יעד: ${intent.gender || "לא צוין"}
אירוע: ${intent.occasion || "לא צוין"}
זמן האירוע: ${intent.eventTime || "לא צוין"}
עונה: ${intent.season || "לא צוינה"}
סגנון: ${intent.style || "לא צוין"}

פריטי הלוק:
${productDescriptions}

הוראות:
- הצג דמות אחת בלבד.
- הצג צילום מלא מכף רגל ועד ראש.
- השתמש במראה טבעי, מכובד ומסחרי.
- שלב את הפריטים כלוק אחד קוהרנטי.
- שמור ככל האפשר על סוגי הפריטים, הצבעים והסגנון המתוארים.
- אל תוסיף טקסט, מחירים, קודי מוצרים או לוגואים לתמונה.
- אל תיצור קולאז׳ או כמה תמונות.
- השתמש ברקע סטודיו נקי ועדין.
`.trim();
}

/**
 * Generates an outfit visualization image.
 *
 * @param {object} options Generation options.
 * @param {object} options.intent Structured customer intent.
 * @param {object[]} options.products Selected catalog products.
 * @return {Promise<object>} Generated image.
 */
async function generateOutfitVisualization({
  intent,
  products,
}) {
  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {
    throw new Error(
      "At least one product is required for outfit visualization"
    );
  }

  const ai = getGeminiClient();

  const prompt = buildVisualizationPrompt({
    intent,
    products,
  });

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL_NAME,
    contents: prompt,

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

  const parts =
    response?.candidates?.[0]?.content?.parts || [];

  const imagePart = parts.find(
    (part) => part?.inlineData?.data
  );

  if (!imagePart) {
    throw new Error(
      "Gemini did not return an outfit image"
    );
  }

  const mimeType =
    imagePart.inlineData.mimeType ||
    "image/png";

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