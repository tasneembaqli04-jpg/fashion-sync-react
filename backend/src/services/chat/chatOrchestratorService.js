/**
 * Central orchestrator of the chatbot. Wires together every stage of the
 * pipeline: intent detection, live data lookups from Firestore (business
 * hours, policy), product search and filtering, and finally — depending on the
 * request — either a plain text answer or a generated outfit visualization.
 *
 * handleChatMessage is the single entry point that drives the whole process
 * for each incoming customer message.
 */
const { INTENTS, detectChatIntent } = require("./chatIntentService");

const { getBusinessHours } = require("./chatBusinessHoursService");
const { getPolicyContent, getStoreDetails } = require("./chatPolicyService");

const { getProductByCode, searchProducts } = require("./chatProductService");

const { streamChatReply } = require("./chatService");

const { generateOutfitVisualization } = require("./outfitVisualizationService");

const { planOutfit } = require("./outfitPlannerService");

const PRODUCT_INTENTS = new Set([
  INTENTS.PRODUCT_SEARCH,
  INTENTS.PRODUCT_DETAILS,
  INTENTS.STOCK_CHECK,
  INTENTS.PRICE_CHECK,
  INTENTS.SALE_SEARCH,
  INTENTS.OUTFIT_RECOMMENDATION,
  INTENTS.OUTFIT_MODIFICATION,
]);

/**
 * Builds the option object passed to searchProducts for a given intent.
 *
 * Hard filters (category, gender, size, colour, price) come straight from the
 * intent. Stock filtering is forced on, and occasion/style/season are passed
 * through for relevance scoring only — they never reject a product.
 *
 * The result limit is raised for outfit requests, so the outfit planner has a
 * wide enough pool of candidates to choose from.
 *
 * @param {object} intent - The normalized customer intent.
 * @return {object} Options for searchProducts.
 */
function buildProductSearchOptions(intent) {
  return {
    searchText: intent.productName || "",
    category: intent.category,
    gender: intent.gender,
    size: intent.size,
    color: intent.color,
    minPrice: intent.minPrice,
    maxPrice: intent.maxPrice,
    // The chatbot never recommends out-of-stock products. This is forced here
    // rather than taken from intent.inStockOnly, because the model only sets
    // that flag for explicit stock questions ("do you have this in M?").
    //
    // The effect is limited to chat: the regular storefront catalogue reads
    // Firestore directly and does not go through this function, so the
    // "notify me when back in stock" flow keeps working.
    //
    // A question about a specific product code bypasses this search via
    // getProductByCode, so an out-of-stock item can still be asked about.
    inStockOnly: true,
    saleOnly: intent.saleOnly || intent.intent === INTENTS.SALE_SEARCH,
    // Soft context fields. Used for relevance scoring only; they reject nothing.
    occasion: intent.occasion,
    style: intent.style,
    season: intent.season,
    limit:
      intent.intent === INTENTS.OUTFIT_RECOMMENDATION ||
      intent.intent === INTENTS.OUTFIT_MODIFICATION
        ? 50
        : 5,
  };
}

/**
 * Builds precise business-hours context for the model, based solely on live
 * Firestore data rather than anything hard-coded. Includes an explicit
 * instruction not to invent hours that are absent from the document.
 *
 * @param {object|null} businessHours - Business hours document from Firestore, or null.
 * @param {string} lang - Response language ("he" or "en").
 * @return {string} Instruction text injected into the message sent to the model.
 */
function buildBusinessHoursContext(businessHours, lang) {
  const isEnglish = lang === "en";

  if (!businessHours) {
    return `
לא נמצא מסמך שעות פעילות ב-Firestore.
אל תמציא שעות פעילות.
אמור ללקוחה שמידע שעות הפעילות אינו זמין כרגע.
`.trim();
  }

  const currentDayKey = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
  })
    .format(new Date())
    .toLowerCase();

  const todayData = Array.isArray(businessHours.days)
    ? businessHours.days.find((day) => day?.key === currentDayKey)
    : null;

  return `
נתוני שעות הפעילות הבאים הגיעו ישירות
מהמסמך settings/businessHours ב-Firestore:

${JSON.stringify(businessHours, null, 2)}

היום הנוכחי בישראל:
${currentDayKey}

נתוני היום הנוכחי:
${JSON.stringify(todayData, null, 2)}

כללים:
- בכל אובייקט יום:
  - key הוא מפתח היום.
  - open מציין אם החנות פתוחה.
  - openTime היא שעת הפתיחה של אותו יום.
  - closeTime היא שעת הסגירה של אותו יום.
- אין להשתמש בשעה של יום אחר.
- כאשר open=false, אמור שהחנות סגורה באותו יום.
- כאשר הלקוחה שואלת על היום, ענה לפי todayData בלבד.
- כאשר הלקוחה שואלת על יום מסוים, מצא את האובייקט של אותו יום.
- כאשר הלקוחה שואלת על כל השבוע, סכם את כל הימים.
- אל תמציא כתובת, איסוף עצמי, משלוחים או שעות חסרות.
- ${isEnglish ? "Show day names and answer in English regardless of the language the customer wrote in." : "הצג את שמות הימים ועני בעברית, בלי קשר לשפה שבה הלקוחה כתבה."}
`.trim();
}

/**
 * Builds store policy and contact context for the model (returns,
 * cancellations, shipping, address), based solely on live Firestore data. As
 * with business hours, this stops the model inventing information the manager
 * never configured.
 *
 * @param {object|null} policyContent - Policy content from Firestore.
 * @param {object|null} storeDetails - Store details from Firestore.
 * @param {string} lang - Response language ("he" or "en").
 * @return {string} Instruction text injected into the message sent to the model.
 */
function buildPolicyContext(policyContent, storeDetails, lang) {
  const isEnglish = lang === "en";
  if (!policyContent && !storeDetails) {
    return `
לא נמצאו מסמכי מדיניות/פרטי חנות ב-Firestore.
אל תמציא מדיניות החזרות, ביטול, משלוחים, כתובת או פרטי קשר.
אמור ללקוחה שהמידע אינו זמין כרגע ושהיא יכולה לבדוק בעמוד המדיניות באתר.
`.trim();
  }

  return `
נתוני המדיניות והחנות הבאים הגיעו ישירות
מהמסמכים settings/policyContent ו-settings/storeDetails ב-Firestore:

תוכן מדיניות:
${JSON.stringify(policyContent, null, 2)}

פרטי חנות:
${JSON.stringify(storeDetails, null, 2)}

כללים:
- ענה על שאלות לגבי החזרות, ביטול הזמנה, משלוחים, כתובת, פרטיות ופרטי קשר
  אך ורק לפי הנתונים שלמעלה.
- אם שדה מסוים חסר/ריק, אמור שהמידע הזה אינו זמין כרגע ותפני לעמוד המדיניות.
- אל תמציא מספרי ימים, מחירים או כתובות שלא מופיעים בנתונים.
- ${isEnglish ? "Answer in English regardless of the language the customer wrote in." : "ענה תמיד בעברית, בלי קשר לשפה שבה הלקוחה כתבה."}
`.trim();
}

/**
 * Converts a raw catalogue product into a uniform structure for the model,
 * used both for text answers and for visualization. Merges the colour list
 * from the variants and from the legacy field, and tags the intended action
 * (keep/replace) when updating an existing outfit.
 *
 * @param {object} product - Raw product from the catalogue.
 * @param {object} [options] - Additional options.
 * @param {string} [options.selectedColor] - Colour chosen for this product in the outfit.
 * @param {string} [options.action] - "KEEP" to keep an existing outfit item, "REPLACE" to swap it.
 * @return {object} Uniform product structure for the model.
 */
function buildProductForAi(product, options = {}) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  const variantColors = variants
    .map((variant) => variant?.colorName || variant?.color || variant?.name)
    .filter(Boolean);

  const existingColors = Array.isArray(product?.colors) ? product.colors : [];

  return {
    code: product?.code || product?.id || "",

    name: product?.name || "",

    // The English name travels with the product so the cards in the chat can
    // follow the interface language. The model is given the Hebrew name and
    // reasons about that; this field is for display only.
    nameEn: product?.nameEn || "",

    category: product?.category || product?.cat || "",

    imageUrl: product?.imageUrl || product?.img || "",

    gender: product?.gender || "",

    price: product?.price ?? null,

    description: product?.description || product?.desc || "",

    colors: [...new Set([...existingColors, ...variantColors])],

    sizes: variants.map((variant) => ({
      color: variant?.colorName || variant?.color || variant?.name || "",

      sizes: variant?.sizes || {},
    })),

    sale: product?.sale ?? false,

    selectedColor: options.selectedColor || product?.selectedColor || null,

    action: options.action || product?.action || null,
  };
}

/**
 * Builds context for the model describing the actual product search results.
 *
 * This is the most important guard against model hallucinations: it feeds the
 * model only products that genuinely exist in the catalogue and in stock, and
 * explicitly instructs it not to invent products, prices or availability that
 * are absent from the list.
 *
 * @param {object} intent - The normalized customer intent.
 * @param {Array<object>} products - The products actually returned by the search.
 * @return {string} Context text injected into the message sent to the model.
 */
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

כאשר מוצג קטלוג מוצרים מתחת לתשובה:
- כתוב תשובה קצרה בלבד (משפט אחד או שניים).
- אל תכתוב רשימות או פירוט של מוצרים בתוך הטקסט.
- אל תפרט את שמות המוצרים.
- אל תפרט את המחירים.
- אל תחזור על מידע שמופיע כבר בכרטיסי המוצרים.
- במקום זאת, סכם בקצרה את תוצאות החיפוש והפנה את הלקוחה לעיין בקטלוג המוצג מתחת.

אם מדובר בהמלצה לאירוע, אפשר להוסיף משפט קצר אחד שמסביר למה המוצרים מתאימים.

כאשר הלקוחה מבקשת צבע או מידה, בדוק את ההתאמה בתוך אותו וריאנט.
אל תאמר שמידה זמינה בצבע מסוים אם הכמות שלה בווריאנט הזה היא אפס או אם המידה אינה קיימת.
אל תאחד מידות של צבעים שונים כאילו כולן זמינות בצבע המבוקש.
`.trim();
}

/**
 * Builds an extra instruction for the model when the current message matches
 * against a previous product (RELATED_SEARCH) — for example "which shoes go
 * with this dress?". Tells the model to use the conversation history and not
 * to copy colour or size from the previous product unless explicitly asked.
 *
 * @param {object} intent - The normalized customer intent.
 * @return {string} Additional instruction text, or an empty string when not relevant.
 */
function buildConversationInstruction(intent) {
  if (intent.conversationAction === "RELATED_SEARCH") {
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

/**
 * Checks whether the current request needs an image (outfit visualization),
 * based on the responseMode decided by the intent detection stage.
 *
 * @param {object} intent - The normalized customer intent.
 * @return {boolean} true when an outfit visualization should be generated.
 */
function isImageResponseRequested(intent) {
  return (
    intent?.responseMode === "IMAGE" &&
    (intent?.intent === INTENTS.OUTFIT_RECOMMENDATION ||
      intent?.intent === INTENTS.OUTFIT_MODIFICATION)
  );
}

/**
 * Main entry point of the chatbot. Runs the whole pipeline for a single
 * customer message, end to end:
 *
 * 1. Load live data from Firestore (business hours, policy, store details)
 * 2. Detect the customer intent
 * 3. If a clarification question is needed, return it immediately and stop
 * 4. Route by intent type: business hours / store info / product search / chat
 * 5. For product requests, search and filter products by real availability
 * 6. For visual outfit requests, run the outfit planner (planOutfit) and the
 *    visualization (generateOutfitVisualization), handling errors at each step
 * 7. For plain text requests, inject the real product context and stream back
 *
 * At every stage where information is missing or an error occurs, the customer
 * receives a clear answer instead of a crash or invented information.
 *
 * @param {object} options - Request parameters.
 * @param {string} options.message - The current customer message.
 * @param {Array} [options.history] - Previous conversation history.
 * @param {Array<object>} [options.currentOutfit] - Outfit currently shown to the customer, for updates.
 * @param {string} [options.currentOutfitImage] - Current customer image (base64), for Try-On.
 * @param {string} options.lang - Response language ("he" or "en").
 * @param {Function} options.onChunk - Callback used to stream response chunks to the customer.
 * @return {Promise<object>} Conversation result — text, matching products, and/or a generated outfit image.
 */
async function handleChatMessage({
  message,
  history = [],
  currentOutfit = [],
  currentOutfitImage = "",
  shownProductCodes = [],
  lang,
  onChunk,
}) {
  let liveBusinessHours = null;
  let livePolicyContent = null;
  let liveStoreDetails = null;

  try {
    [liveBusinessHours, livePolicyContent, liveStoreDetails] =
      await Promise.all([
        getBusinessHours(),
        getPolicyContent(),
        getStoreDetails(),
      ]);
  } catch (error) {
    console.error("LIVE CHAT CONTEXT FETCH ERROR:", error?.message || error);
  }

  const liveDataContext = {
    lang,
    businessHours: liveBusinessHours,
    policyContent: livePolicyContent,
    storeDetails: liveStoreDetails,
  };

  const intent = await detectChatIntent({
    message,
    history,
    lang,
  });

  if (intent.needsClarification && intent.clarificationQuestion) {
    const clarificationText = intent.clarificationQuestion;

    if (typeof onChunk === "function") {
      onChunk(clarificationText);
    }

    return {
      type: "text",
      text: clarificationText,
      intent,
      products: [],
      responseMode: "TEXT",
      needsClarification: true,
    };
  }

  if (!intent || !intent.intent) {
    return streamChatReply({
      message,
      history,
      onChunk,
      ...liveDataContext,
    });
  }
  if (intent.intent === INTENTS.BUSINESS_HOURS) {
    const businessHoursContext = buildBusinessHoursContext(
      liveBusinessHours,
      lang,
    );

    return streamChatReply({
      message: `
הודעת הלקוחה הנוכחית:
${message}

${businessHoursContext}
`.trim(),
      history,
      onChunk,
      ...liveDataContext,
    });
  }

  if (intent.intent === INTENTS.STORE_INFO) {
    const policyContext = buildPolicyContext(
      livePolicyContent,
      liveStoreDetails,
      lang,
    );

    return streamChatReply({
      message: `
הודעת הלקוחה הנוכחית:
${message}

${policyContext}
`.trim(),
      history,
      onChunk,
      ...liveDataContext,
    });
  }

  if (!PRODUCT_INTENTS.has(intent.intent)) {
    return streamChatReply({
      message,
      history,
      onChunk,
      ...liveDataContext,
    });
  }

  let products = [];

  if (intent.productCode) {
    const product = await getProductByCode(intent.productCode);

    if (product) {
      products = [product];
    }
  } else {
    const searchOptions = buildProductSearchOptions(intent);

    if (intent.moreResultsRequested) {
      searchOptions.excludeProductCodes = Array.isArray(shownProductCodes)
        ? shownProductCodes
        : [];
    }

    products = await searchProducts(searchOptions);
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

    let outfitPlan;

    try {
      outfitPlan = await planOutfit({
        products,
        currentOutfit,
        intent,
        message,
        history,
      });
    } catch (error) {
      console.error("OUTFIT PLANNER ERROR:", error?.message || error);

      const messageText =
        "לא הצלחתי לבחור כרגע לוק מתאים מתוך הקטלוג. אפשר לנסות שוב בעוד רגע.";

      onChunk(messageText);

      return {
        intent,
        products: [],
        responseMode: "IMAGE",
        imageGenerated: false,
        error: "OUTFIT_PLANNING_FAILED",
      };
    }

    if (!outfitPlan?.success || !outfitPlan.selectedProducts?.length) {
      const messageText =
        outfitPlan?.explanation ||
        "לא נמצאו כרגע מספיק מוצרים מתאימים לבניית הלוק.";

      onChunk(messageText);

      return {
        intent,
        products: [],
        responseMode: "IMAGE",
        imageGenerated: false,
        error: "NO_OUTFIT_PRODUCTS",
      };
    }

    const normalizedCurrentOutfit = Array.isArray(currentOutfit)
      ? currentOutfit
      : [];

    const requestedCategory = intent?.category || "";

    const productsForVisualization = outfitPlan.selectedProducts.map(
      (product) => {
        const productCode = product?.code || product?.id || "";

        const previousProduct = normalizedCurrentOutfit.find(
          (currentProduct) =>
            (currentProduct?.code || currentProduct?.id || "") === productCode,
        );

        const productCategory = product?.category || product?.cat || "";

        const isExistingProduct = Boolean(previousProduct);

        const isRequestedCategory =
          requestedCategory && productCategory === requestedCategory;

        const shouldKeep =
          intent?.intent === "OUTFIT_MODIFICATION" &&
          isExistingProduct &&
          !isRequestedCategory;

        return buildProductForAi(
          {
            ...previousProduct,
            ...product,

            colors:
              Array.isArray(product?.colors) && product.colors.length
                ? product.colors
                : previousProduct?.colors || [],

            variants:
              Array.isArray(product?.variants) && product.variants.length
                ? product.variants
                : previousProduct?.variants || [],

            imageUrl:
              product?.imageUrl ||
              product?.img ||
              previousProduct?.imageUrl ||
              previousProduct?.img ||
              "",
          },
          {
            selectedColor: shouldKeep
              ? previousProduct?.selectedColor || null
              : intent?.color ||
                product?.selectedColor ||
                previousProduct?.selectedColor ||
                null,

            action: shouldKeep
              ? "KEEP"
              : isExistingProduct
                ? "KEEP"
                : "REPLACE",
          },
        );
      },
    );

    try {
      const visualization = await generateOutfitVisualization({
        originalMessage: message,
        history,
        intent,
        outfitPlan,
        currentOutfit,
        currentOutfitImage,
        products: productsForVisualization,
      });

      return {
        intent,
        products: productsForVisualization,
        responseMode: "IMAGE",
        imageGenerated: true,
        image: visualization,
        outfitExplanation: outfitPlan.explanation || "",
      };
    } catch (error) {
      console.error("OUTFIT VISUALIZATION ERROR:", error?.message || error);

      const messageText =
        "בחרתי לוק מתוך הקטלוג, אבל לא הצלחתי ליצור כרגע את התמונה. אפשר לנסות שוב בעוד רגע.";

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

  const productContext = buildProductContext(intent, products);
  const conversationInstruction = buildConversationInstruction(intent);

  const chatResult = await streamChatReply({
    message: `
הודעת הלקוחה הנוכחית:
${message}

${conversationInstruction}

${productContext}
`.trim(),
    history,
    onChunk,
    ...liveDataContext,
  });

  const catalogProducts = products.map((product) => buildProductForAi(product));

  return {
    ...(chatResult && typeof chatResult === "object" ? chatResult : {}),

    type: catalogProducts.length ? "products" : "text",

    text: typeof chatResult === "string" ? chatResult : chatResult?.text || "",

    intent,

    products: catalogProducts,

    responseMode: "TEXT",

    imageGenerated: false,
  };
}

module.exports = {
  handleChatMessage,
};
