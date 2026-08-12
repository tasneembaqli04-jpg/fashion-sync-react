/**
 * קובץ זה הוא "המתאם" (Orchestrator) המרכזי של הצ'אטבוט — הוא מחבר יחד
 * את כל שלבי צינור העיבוד: זיהוי כוונה, שליפת נתונים חיים מ-Firestore
 * (שעות פעילות, מדיניות), חיפוש וסינון מוצרים, ולבסוף — בהתאם לסוג
 * הבקשה — מענה טקסטואלי רגיל, או בניית לוק והדמיה חזותית (Try-On).
 *
 * הפונקציה המרכזית handleChatMessage היא נקודת הכניסה היחידה שממנה
 * מופעל כל התהליך עבור כל הודעה שמתקבלת מהלקוחה.
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
 * קובץ זה הוא "המתאם" (Orchestrator) המרכזי של הצ'אטבוט — הוא מחבר יחד
 * את כל שלבי צינור העיבוד: זיהוי כוונה, שליפת נתונים חיים מ-Firestore
 * (שעות פעילות, מדיניות), חיפוש וסינון מוצרים, ולבסוף — בהתאם לסוג
 * הבקשה — מענה טקסטואלי רגיל, או בניית לוק והדמיה חזותית (Try-On).
 *
 * הפונקציה המרכזית handleChatMessage היא נקודת הכניסה היחידה שממנה
 * מופעל כל התהליך עבור כל הודעה שמתקבלת מהלקוחה.
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
    inStockOnly: intent.inStockOnly,
    saleOnly: intent.saleOnly || intent.intent === INTENTS.SALE_SEARCH,
    limit:
      intent.intent === INTENTS.OUTFIT_RECOMMENDATION ||
      intent.intent === INTENTS.OUTFIT_MODIFICATION
        ? 50
        : 5,
  };
}

/**
 * בונה עבור המודל הקשר טקסטואלי מדויק על שעות הפעילות של החנות, בהתבסס
 * אך ורק על הנתונים החיים מ-Firestore (לא נתונים מקובעים בקוד). כולל
 * הנחיה מפורשת למודל שלא "להמציא" שעות שאינן קיימות במסמך.
 *
 * @param {object|null} businessHours - מסמך שעות הפעילות מ-Firestore, או null אם לא נמצא.
 * @param {string} lang - שפת התשובה ("he" או "en").
 * @return {string} טקסט ההנחיה שיוזרק להודעה הנשלחת למודל.
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
 * בונה עבור המודל הקשר טקסטואלי על מדיניות החנות ופרטי הקשר שלה
 * (החזרות, ביטולים, משלוחים, כתובת), בהתבסס אך ורק על הנתונים החיים
 * מ-Firestore. כמו בפונקציית שעות הפעילות, מונע מהמודל "להמציא" מידע
 * שאינו קיים בפועל בהגדרות שהמנהלת קבעה.
 *
 * @param {object|null} policyContent - תוכן המדיניות מ-Firestore.
 * @param {object|null} storeDetails - פרטי החנות מ-Firestore.
 * @param {string} lang - שפת התשובה ("he" או "en").
 * @return {string} טקסט ההנחיה שיוזרק להודעה הנשלחת למודל.
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
 * ממירה אובייקט מוצר גולמי מהקטלוג למבנה נתונים אחיד המיועד לשימוש
 * המודל (הן להסבר טקסטואלי והן להדמיה חזותית) — כולל איחוד רשימת
 * הצבעים מהוריאנטים ומהשדה הישן, ותיוג הפעולה הרצויה (שמירה/החלפה)
 * כאשר מדובר בעדכון לוק קיים.
 *
 * @param {object} product - מוצר גולמי מהקטלוג.
 * @param {object} [options] - אפשרויות נוספות.
 * @param {string} [options.selectedColor] - הצבע שנבחר עבור המוצר בלוק.
 * @param {string} [options.action] - "KEEP" לשמירת פריט קיים בלוק, או "REPLACE" להחלפתו.
 * @return {object} מבנה מוצר אחיד עבור המודל.
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
 * בונה עבור המודל הקשר טקסטואלי על תוצאות חיפוש המוצרים בפועל.
 *
 * זהו החלק הקריטי ביותר במניעת "הזיות" (Hallucinations) של המודל:
 * הפונקציה מזינה למודל אך ורק מוצרים שנמצאו בפועל בקטלוג ובמלאי, ומורה
 * לו במפורש שלא להמציא מוצרים, מחירים או זמינות שאינם מופיעים ברשימה.
 *
 * @param {object} intent - הכוונה המנורמלת של הלקוחה.
 * @param {Array<object>} products - המוצרים שנמצאו בפועל בחיפוש.
 * @return {string} טקסט ההקשר שיוזרק להודעה הנשלחת למודל.
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
 * בונה הנחיה נוספת למודל כאשר ההודעה הנוכחית היא חלק מהתאמה למוצר
 * קודם (RELATED_SEARCH) — למשל "איזה נעליים יתאימו לשמלה הזאת?".
 * מנחה את המודל להשתמש בהיסטוריית השיחה ולא להעתיק אוטומטית צבע/מידה
 * מהמוצר הקודם, אלא אם התבקש הדבר במפורש.
 *
 * @param {object} intent - הכוונה המנורמלת של הלקוחה.
 * @return {string} טקסט הנחיה נוסף, או מחרוזת ריקה אם אינו רלוונטי.
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
 * בודקת האם הבקשה הנוכחית דורשת יצירת תמונה (הדמיית לוק), בהתבסס על
 * responseMode שקבע שלב זיהוי הכוונה.
 *
 * @param {object} intent - הכוונה המנורמלת של הלקוחה.
 * @return {boolean} true אם יש ליצור הדמיה חזותית של הלוק.
 */
function isImageResponseRequested(intent) {
  return (
    intent?.responseMode === "IMAGE" &&
    (intent?.intent === INTENTS.OUTFIT_RECOMMENDATION ||
      intent?.intent === INTENTS.OUTFIT_MODIFICATION)
  );
}

/**
 * נקודת הכניסה המרכזית של הצ'אטבוט — מפעילה את כל צינור העיבוד עבור
 * הודעה בודדת מהלקוחה, מתחילתו ועד סופו:
 *
 * 1. שליפת נתונים חיים מ-Firestore (שעות פעילות, מדיניות, פרטי חנות)
 * 2. זיהוי כוונת הלקוחה (Intent Detection)
 * 3. במקרה של שאלת הבהרה נדרשת — מחזירה אותה מיד ועוצרת
 * 4. ניתוב לפי סוג הכוונה: שעות פעילות / מידע כללי / חיפוש מוצרים / שיחה כללית
 * 5. עבור בקשות מוצר — חיפוש וסינון מוצרים לפי זמינות בפועל
 * 6. עבור בקשות ללוק חזותי — הפעלת מתכנן הלוקים (planOutfit) והדמיה
 *    חזותית (generateOutfitVisualization), עם טיפול בשגיאות בכל שלב
 * 7. עבור בקשות טקסט רגילות — הזרקת הקשר המוצרים האמיתי ומענה בסטרימינג
 *
 * הפונקציה בנויה כך שבכל שלב שבו חסר מידע או מתרחשת שגיאה, מוחזרת
 * ללקוחה תשובה ברורה במקום קריסה או המצאת מידע.
 *
 * @param {object} options - פרמטרי הבקשה.
 * @param {string} options.message - הודעת הלקוחה הנוכחית.
 * @param {Array} [options.history] - היסטוריית השיחה הקודמת.
 * @param {Array<object>} [options.currentOutfit] - הלוק הנוכחי המוצג ללקוחה (לצורך עדכון/החלפה).
 * @param {string} [options.currentOutfitImage] - תמונת הלקוחה הנוכחית (base64), לצורך Try-On.
 * @param {string} options.lang - שפת התשובה ("he" או "en").
 * @param {Function} options.onChunk - קולבק לשליחת חלקי תשובה בסטרימינג ללקוחה.
 * @return {Promise<object>} תוצאת השיחה — טקסט, מוצרים רלוונטיים, ו/או תמונת לוק שנוצרה.
 */
async function handleChatMessage({
  message,
  history = [],
  currentOutfit = [],
  currentOutfitImage = "",
  lang,
  onChunk,
}) {
  let liveBusinessHours = null;
  let livePolicyContent = null;
  let liveStoreDetails = null;

  try {
    [liveBusinessHours, livePolicyContent, liveStoreDetails] = await Promise.all([
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
  });
  console.log("DETECTED CHAT INTENT:", intent);
  console.log(
    "CURRENT OUTFIT:",
    Array.isArray(currentOutfit)
      ? currentOutfit.map((product) => product?.code)
      : [],
  );

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
    const businessHoursContext = buildBusinessHoursContext(liveBusinessHours, lang);

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
    const policyContext = buildPolicyContext(livePolicyContent, liveStoreDetails, lang);

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
    products = await searchProducts(buildProductSearchOptions(intent));
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
    console.log("OUTFIT VISUALIZATION INPUT:", {
      originalMessage: message,
      intent: {
        intent: intent.intent,
        category: intent.category,
        color: intent.color,
        style: intent.style,
        occasion: intent.occasion,
      },
      plannerExplanation: outfitPlan.explanation || "",
      currentOutfit: Array.isArray(currentOutfit)
        ? currentOutfit.map((product) => product?.code)
        : [],
      selectedProducts: productsForVisualization.map((product) => ({
        code: product.code,
        name: product.name,
        category: product.category,
        colors: product.colors,
        selectedColor: product.selectedColor,
        action: product.action,
      })),
    });

    try {
      console.log("CURRENT OUTFIT IMAGE RECEIVED:", {
        exists:
          typeof currentOutfitImage === "string" &&
          currentOutfitImage.length > 0,

        length:
          typeof currentOutfitImage === "string"
            ? currentOutfitImage.length
            : 0,
      });

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
