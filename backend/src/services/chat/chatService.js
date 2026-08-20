const { getGeminiClient } = require("../../config/gemini");

const MODEL_NAME = "gemini-3-flash-preview";

function buildSystemInstruction({
  lang,
  businessHours,
  policyContent,
  storeDetails,
} = {}) {
  const isEnglish = lang === "en";
  const productResultsRule = isEnglish
    ? `
When showing products from the catalog:
When showing products from the catalog:
- Do not imply that the displayed products are all matching products unless you know that all matches are being shown.
- When only a subset of matching products is shown, explicitly tell the customer that this is only a selection and that additional matching products are not currently displayed.
- Invite the customer to ask to see more options.
`
    : `
כאשר מוצגים ללקוח מוצרים מתוך הקטלוג:
- אל תציג את הרשימה כאילו היא כוללת את כל המוצרים המתאימים, אלא אם ידוע שכל התוצאות מוצגות.
- כאשר מוצג רק חלק מהמוצרים המתאימים, אמור ללקוח במפורש שזו רק חלק מהאפשרויות ושקיימים מוצרים מתאימים נוספים שאינם מוצגים כרגע.
- הצע ללקוח לבקש לראות אפשרויות נוספות.
`;

  const languageLine = isEnglish
    ? "Always answer in English, briefly and in a friendly tone (2-4 sentences max), like a real customer service rep."
    : "ענה/י תמיד בעברית, בקצרה וידידותית (2-4 משפטים לכל היותר), כמו נציג/ת שירות אמיתי/ת.";

  const liveDataBlock = `
נתונים חיים מ-Firestore (settings/businessHours, settings/policyContent, settings/storeDetails):

שעות פעילות:
${businessHours ? JSON.stringify(businessHours, null, 2) : "לא זמין"}

תוכן מדיניות:
${policyContent ? JSON.stringify(policyContent, null, 2) : "לא זמין"}

פרטי חנות:
${storeDetails ? JSON.stringify(storeDetails, null, 2) : "לא זמין"}
`.trim();

  return `
את/ה "SYNC" - עוזר/ת שירות הלקוחות של FashionSync, חנות בגדים אונליין ישראלית.
${languageLine}

${liveDataBlock}
${productResultsRule}

כללים:
- כל תשובה על שעות פעילות, מדיניות החזרות/ביטול, משלוחים, כתובת, או פרטי קשר -
  אך ורק לפי הנתונים החיים שלמעלה. אל תמציא ואל תשתמש בידע כללי/ישן.
- אם נתון מסוים חסר/"לא זמין", אמור שהמידע אינו זמין כרגע והפני לעמוד המדיניות באתר.
- קטגוריות בקטלוג: חולצות, מכנסיים, שמלות, עליוניות, נעליים, אביזרים - לגברים ולנשים.
- יש תוכנית נאמנות (נקודה אחת לכל ₪1 שהוצא), וקופונים (מוצגים במסך "נקודות וקופונים").
- אם השאלה לא קשורה לחנות בגדים בכלל - הפני בנימוס בחזרה לנושא החנות.
- אם אינך יודע משהו ספציפי (כמו מלאי של מוצר מסוים) - הצע ללקוחה לבדוק בקטלוג או לפנות לצוות.
- לעולם אל תמציא מספרי הזמנה, מחירים ספציפיים למוצר, או פרטים אישיים על לקוחות.
`.trim();
}

function buildGeminiConfig(liveDataContext) {
  return {
    systemInstruction: buildSystemInstruction(liveDataContext),
    temperature: 1,
    maxOutputTokens: 1024,
    thinkingConfig: {
      thinkingLevel: "minimal",
    },
  };
}

async function generateChatReply({
  message,
  history = [],
  lang,
  businessHours,
  policyContent,
  storeDetails,
}) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required");
  }

  const ai = getGeminiClient();
  const contents = [];

  history.slice(-8).forEach((turn) => {
    if (!turn?.text) return;

    contents.push({
      role: turn.role === "bot" ? "model" : "user",
      parts: [{ text: String(turn.text) }],
    });
  });

  contents.push({
    role: "user",
    parts: [{ text: message.trim() }],
  });

  const result = await ai.models.generateContent({
    model: MODEL_NAME,
    contents,
    config: buildGeminiConfig({
      lang,
      businessHours,
      policyContent,
      storeDetails,
    }),
  });

  const reply =
    result?.text || result?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!reply.trim()) {
    throw new Error("Empty reply from model");
  }

  return {
    reply: reply.trim(),
  };
}

async function streamChatReply({
  message,
  history = [],
  onChunk,
  lang,
  businessHours,
  policyContent,
  storeDetails,
}) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required");
  }

  if (typeof onChunk !== "function") {
    throw new Error("onChunk callback is required");
  }

  const ai = getGeminiClient();
  const contents = [];

  history.slice(-6).forEach((turn) => {
    if (!turn?.text) return;

    contents.push({
      role: turn.role === "bot" ? "model" : "user",
      parts: [{ text: String(turn.text) }],
    });
  });

  contents.push({
    role: "user",
    parts: [{ text: message.trim() }],
  });

  const MAX_ATTEMPTS = 2;
  const ATTEMPT_TIMEOUT_MS = 8000;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const streamResult = await Promise.race([
        ai.models.generateContentStream({
          model: MODEL_NAME,
          contents,
          config: buildGeminiConfig({
            lang,
            businessHours,
            policyContent,
            storeDetails,
          }),
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Gemini request timed out")),
            ATTEMPT_TIMEOUT_MS,
          ),
        ),
      ]);

      let fullText = "";

      for await (const chunk of streamResult) {
        const text =
          chunk?.text ||
          chunk?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "";

        if (text) {
          fullText += text;
          onChunk(text);
        }
      }

      if (!fullText.trim()) {
        throw new Error("Empty streamed reply from model");
      }

      return fullText.trim();
    } catch (err) {
      lastError = err;

      const isRetryable =
        err?.status === 503 ||
        err?.status === 429 ||
        /UNAVAILABLE|RESOURCE_EXHAUSTED|timed out/.test(
          String(err?.message || ""),
        );

      console.error(
        `streamChatReply attempt ${attempt} failed:`,
        err?.message || err,
      );

      if (!isRetryable || attempt === MAX_ATTEMPTS) {
        throw lastError;
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  throw lastError;
}

module.exports = {
  generateChatReply,
  streamChatReply,
};
