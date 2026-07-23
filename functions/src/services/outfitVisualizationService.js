const {getGeminiClient} = require("../config/gemini");

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
להציג את פריטי FashionSync שבתמונות הייחוס כלוק אחד שלם והרמוני.

פרטי הבקשה:
קהל יעד: ${intent.gender || "לא צוין"}
אירוע: ${intent.occasion || "לא צוין"}
זמן האירוע: ${intent.eventTime || "לא צוין"}
עונה: ${intent.season || "לא צוינה"}
סגנון: ${intent.style || "לא צוין"}

פריטי הלוק:
${productDescriptions}

הוראות מחייבות:
- תמונות המוצרים המצורפות הן תמונות ייחוס מחייבות.
- כל תמונת ייחוס מתאימה לפריט המתואר מיד לפניה.
- הצג דמות אחת בלבד.
- הצג צילום מלא מכף רגל ועד ראש.
- הלבש את הדמות בפריטים שסופקו בלבד ככל האפשר.
- שמור במדויק ככל האפשר על הגזרה והמבנה של כל מוצר.
- שמור על קו הכתפיים, הצווארון, השרוולים והאורך.
- שמור על מלמלות, תחרה, קישוטים, אבזמים ופרטים מיוחדים.
- שמור על הצבעים, הבד, המרקם והצללית של המוצרים.
- אל תחליף מוצר בעיצוב כללי או במוצר דומה.
- אל תשנה שמלה עם מלמלות לשמלה חלקה.
- אל תמציא פריט לבוש מרכזי שלא נשלח כתמונת ייחוס.
- אם סופקה שמלה, היא תהיה פריט הלבוש המרכזי בתמונה.
- התאם את הנעליים, התיק והאביזרים לפי תמונות הייחוס שלהם.
- השתמש במראה טבעי, מכובד ומסחרי.
- אל תוסיף טקסט, מחיר, קוד מוצר או לוגו לתמונה.
- אל תיצור קולאז׳ או כמה תמונות.
- השתמש ברקע סטודיו נקי ועדין.
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
  const normalizedMimeType = String(
    mimeType || ""
  )
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

  const normalizedUrl = String(
    imageUrl || ""
  ).toLowerCase();

  if (
    normalizedUrl.includes(".jpg") ||
    normalizedUrl.includes(".jpeg")
  ) {
    return "image/jpeg";
  }

  if (normalizedUrl.includes(".webp")) {
    return "image/webp";
  }

  return "image/png";
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
    throw new Error(
      `Failed to download product image: ${response.status}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  if (!arrayBuffer.byteLength) {
    throw new Error("Downloaded product image is empty");
  }

  if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      "Product image is larger than the allowed limit"
    );
  }

  const mimeType = normalizeImageMimeType(
    response.headers.get("content-type"),
    imageUrl
  );

  return {
    inlineData: {
      mimeType,
      data: Buffer
        .from(arrayBuffer)
        .toString("base64"),
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
    .filter((product) =>
      Boolean(product?.imageUrl)
    )
    .slice(0, MAX_REFERENCE_IMAGES);

  const settledResults = await Promise.allSettled(
    productsWithImages.map(async (product, index) => {
      const imagePart =
        await downloadImageAsInlineData(
          product.imageUrl
        );

      return [
        {
          text: `
תמונת ייחוס לפריט ${index + 1}:
${product.name || "מוצר ללא שם"}
קוד מוצר: ${product.code || "לא ידוע"}
קטגוריה: ${product.category || "לא ידועה"}

יש לשמור על העיצוב החזותי של מוצר זה.
`.trim(),
        },
        imagePart,
      ];
    })
  );

  const parts = [];

  settledResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      parts.push(...result.value);
      return;
    }

    console.warn(
      "PRODUCT REFERENCE IMAGE DOWNLOAD FAILED:",
      {
        product:
          productsWithImages[index]?.code ||
          productsWithImages[index]?.name ||
          null,
        error:
          result.reason?.message ||
          String(result.reason),
      }
    );
  });

  return parts;
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

  const referenceImageParts =
    await buildReferenceImageParts(products);

  if (!referenceImageParts.length) {
    console.warn(
      "No product reference images were downloaded; generating from text only"
    );
  }

  console.log(
    "OUTFIT REFERENCE IMAGES:",
    referenceImageParts.filter(
      (part) => part?.inlineData
    ).length
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