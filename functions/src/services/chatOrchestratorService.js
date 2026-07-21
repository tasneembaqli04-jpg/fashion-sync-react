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
  return {
    code: product.code,
    name: product.name,
    category: product.category,
    gender: product.gender,
    price: product.price,
    description: product.desc,
    colors: product.variants
      .map((variant) => variant?.colorName)
      .filter(Boolean),
    sizes: product.variants.map((variant) => ({
      color: variant?.colorName || "",
      sizes: variant?.sizes || {},
    })),
    sale: product.sale,
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