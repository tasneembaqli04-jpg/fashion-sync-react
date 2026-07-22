const {
  INTENTS,
  detectChatIntent,
} = require("./chatIntentService");

const {
  getProductByCode,
  searchProducts,
} = require("./chatProductService");

const {
  streamChatReply,
} = require("./chatService");

const {
  generateOutfitVisualization,
} = require("./outfitVisualizationService");

const PRODUCT_INTENTS = new Set([
  INTENTS.PRODUCT_SEARCH,
  INTENTS.PRODUCT_DETAILS,
  INTENTS.STOCK_CHECK,
  INTENTS.PRICE_CHECK,
  INTENTS.SALE_SEARCH,
  INTENTS.OUTFIT_RECOMMENDATION,
]);

function buildProductSearchOptions(intent) {
  return {
    searchText: intent.productName || "",
    category: intent.category,
    gender: intent.gender,
    size: intent.size,
    color: intent.color,
    minPrice: intent.minPrice,
    maxPrice: intent.maxPrice,
    inStockOnly: intent.inStockOnly,
    saleOnly:
      intent.saleOnly ||
      intent.intent === INTENTS.SALE_SEARCH,
    limit: 5,
  };
}

function buildProductForAi(product) {
  const variants = Array.isArray(product.variants)
    ? product.variants
    : [];

  return {
    code: product.code || product.id || "",
    name: product.name || "",
    category: product.category || product.cat || "",
    imageUrl: product.img || product.imageUrl || "",
    gender: product.gender || "",
    price: product.price ?? null,
    description: product.desc || product.description || "",
    colors: [
      ...new Set(
        variants
          .map(
            (variant) =>
              variant?.colorName ||
              variant?.color ||
              variant?.name
          )
          .filter(Boolean)
      ),
    ],
    sizes: variants.map((variant) => ({
      color:
        variant?.colorName ||
        variant?.color ||
        variant?.name ||
        "",
      sizes: variant?.sizes || {},
    })),
    sale: product.sale ?? false,
  };
}

function buildProductContext(intent, products) {
  if (!products.length && intent.productCode) {
    return `
תוצאת המערכת:
לא נמצא מוצר עם הקוד ${intent.productCode}.

בקשת הקנייה שנותחה:
${JSON.stringify(intent, null, 2)}

ענה ללקוחה שהמוצר לא נמצא בקטלוג.
אל תמציא מוצר עם הקוד הזה.
אפשר להציע לה לבדוק את הקוד או לתאר את המוצר במילים.
`.trim();
  }

  if (!products.length) {
    return `
תוצאת המערכת:
לא נמצאו מוצרים התואמים לבקשת הלקוחה.

בקשת הקנייה שנותחה:
${JSON.stringify(intent, null, 2)}

ענה ללקוחה שלא נמצאה התאמה מדויקת.
אל תמציא מוצרים.
אפשר לשאול אם היא רוצה לשנות צבע, מידה, קטגוריה או תקציב.
`.trim();
  }

  const productsForAi = products.map(buildProductForAi);

  return `
תוצאת חיפוש אמיתית מתוך קטלוג FashionSync:

בקשת הקנייה שנותחה:
${JSON.stringify(intent, null, 2)}

המוצרים שנמצאו:
${JSON.stringify(productsForAi, null, 2)}

ענה ללקוחה על סמך המוצרים האלה בלבד.
אל תמציא מוצרים, מחירים, צבעים, מידות או מלאי.
אם מדובר בהמלצה לאירוע, הסבר בקצרה למה המוצרים מתאימים.

כאשר הלקוחה מבקשת צבע או מידה, בדוק את ההתאמה בתוך אותו וריאנט.
אל תאמר שמידה זמינה בצבע מסוים אם הכמות שלה בווריאנט הזה היא אפס או אם המידה אינה קיימת.
אל תאחד מידות של צבעים שונים כאילו כולן זמינות בצבע המבוקש.
`.trim();
}

function buildConversationInstruction(intent) {
  if (
    intent.conversationAction === "RELATED_SEARCH"
  ) {
    return `
הנחיית הקשר שיחה:
ההודעה הנוכחית עשויה להיות תשובה לשאלת הבהרה קודמת.

השתמש בהיסטוריית השיחה כדי להבין:
- מהו המוצר הקודם שאליו הלקוחה רוצה לבצע התאמה.
- מהו סוג המוצר החדש שהיא בחרה עכשיו.
- הקטגוריה שב-intent היא קטגוריית המוצרים שיש להמליץ עליהם כעת.

אל תענה רק במילה כללית כמו "בחירה".
הצע ללקוחה מוצרים קונקרטיים מתוך תוצאות החיפוש והסבר בקצרה כיצד הם יכולים להתאים למוצר הקודם.

אל תעתיק אוטומטית צבע, מידה או תקציב מהמוצר הקודם למוצר החדש,
אלא אם הלקוחה ביקשה זאת במפורש.
`.trim();
  }

  return "";
}

function isImageResponseRequested(intent) {
  return (
    intent?.responseMode === "IMAGE" &&
    intent?.intent === INTENTS.OUTFIT_RECOMMENDATION
  );
}

function selectVisualizationProducts(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  const preferredCategories = [
    "שמלות",
    "נעליים",
    "אביזרים",
    "עליוניות",
    "חולצות",
    "מכנסיים",
  ];

  const selectedProducts = [];
  const usedCategories = new Set();

  for (const preferredCategory of preferredCategories) {
    const matchingProduct = products.find((product) => {
      const productCategory =
        product.category || product.cat || "";

      return (
        productCategory === preferredCategory &&
        !usedCategories.has(productCategory)
      );
    });

    if (matchingProduct) {
      selectedProducts.push(matchingProduct);
      usedCategories.add(preferredCategory);
    }

    if (selectedProducts.length === 4) {
      break;
    }
  }

  if (!selectedProducts.length) {
    return products.slice(0, 4);
  }

  return selectedProducts;
}

async function handleChatMessage({
  message,
  history = [],
  onChunk,
}) {
  const intent = await detectChatIntent({
    message,
    history,
  });
  console.log("DETECTED CHAT INTENT:", intent);

  if (
    intent.needsClarification &&
    intent.clarificationQuestion
  ) {
    onChunk(intent.clarificationQuestion);

    return {
      intent,
      products: [],
      needsClarification: true,
    };
  }

  if (!intent || !intent.intent) {
    return streamChatReply({
      message,
      history,
      onChunk,
    });
  }

  if (!PRODUCT_INTENTS.has(intent.intent)) {
    return streamChatReply({
      message,
      history,
      onChunk,
    });
  }

  let products = [];

  if (intent.productCode) {
    const product = await getProductByCode(
      intent.productCode
    );

    if (product) {
      products = [product];
    }
  } else {
    products = await searchProducts(
      buildProductSearchOptions(intent)
    );
  }
  
  if (isImageResponseRequested(intent)) {
    if (!products.length) {
      const messageText =
        "לא מצאתי כרגע מוצרים מתאימים שמהם ניתן ליצור את המחשת הלוק.";

      onChunk(messageText);

      return {
        intent,
        products: [],
        responseMode: "IMAGE",
        imageGenerated: false,
      };
    }

    const selectedProducts =
      selectVisualizationProducts(products);

    const productsForVisualization =
      selectedProducts.map(buildProductForAi);

    try {
      const visualization =
        await generateOutfitVisualization({
          intent,
          products: productsForVisualization,
        });

      return {
        intent,
        products: productsForVisualization,
        responseMode: "IMAGE",
        imageGenerated: true,
        image: visualization,
      };
    } catch (error) {
      console.error(
        "OUTFIT VISUALIZATION ERROR:",
        error?.message || error
      );

      const messageText =
        "לא הצלחתי ליצור כרגע את תמונת הלוק. אפשר לנסות שוב בעוד רגע.";

      onChunk(messageText);

      return {
        intent,
        products: productsForVisualization,
        responseMode: "IMAGE",
        imageGenerated: false,
        error: "IMAGE_GENERATION_FAILED",
      };
    }
  }

  const productContext = buildProductContext(
    intent,
    products
  );
  const conversationInstruction =
    buildConversationInstruction(intent);

  return streamChatReply({
    message: `
  הודעת הלקוחה הנוכחית:   
  ${message}

  ${conversationInstruction}

  ${productContext}
  `.trim(),
    history,
    onChunk,
  });
}

module.exports = {
  handleChatMessage,
};
