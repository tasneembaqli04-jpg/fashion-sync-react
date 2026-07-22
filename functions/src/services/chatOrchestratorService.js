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

  const productContext = buildProductContext(
    intent,
    products
  );

  return streamChatReply({
    message: `
הודעת הלקוחה:
${message}

${productContext}
`.trim(),
    history,
    onChunk,
  });
}

module.exports = {
  handleChatMessage,
};