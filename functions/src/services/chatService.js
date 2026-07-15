const { ai } = require("../config/gemini");

const MODEL_NAME = "gemini-flash-latest";

const SYSTEM_INSTRUCTION = `
את/ה "SYNC" - עוזר/ת שירות הלקוחות של FashionSync, חנות בגדים אונליין ישראלית.
ענה/י תמיד בעברית, בקצרה וידידותית (2-4 משפטים לכל היותר), כמו נציג/ת שירות אמיתי/ת.

מידע קבוע על החנות:
- משלוח רגיל: 5-7 ימי עסקים, ₪25 (חינם לרכישות מעל ₪200).
- משלוח מהיר: 2-3 ימי עסקים, ₪29.
- משלוח באותו יום: ₪59 (מרכז הארץ בלבד).
- איסוף עצמי: חינם, הרצל 42 תל אביב.
- החזרות: עד 30 יום מיום הרכישה, באריזה מקורית.
- קטגוריות בקטלוג: חולצות, מכנסיים, שמלות, עליוניות, נעליים, אביזרים - לגברים ולנשים.
- יש תוכנית נאמנות (נקודה אחת לכל ₪1 שהוצא), וקופונים (מוצגים במסך "נקודות וקופונים").

אם השאלה לא קשורה לחנות בגדים בכלל - הפני בנימוס בחזרה לנושא החנות.
אם אינך יודע משהו ספציפי (כמו מלאי של מוצר מסוים) - הצע ללקוחה לבדוק בקטלוג או לפנות לצוות.
לעולם אל תמציא מספרי הזמנה, מחירים ספציפיים למוצר, או פרטים אישיים על לקוחות.
`.trim();

async function generateChatReply({ message, history = [] }) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required");
  }

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
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.6,
      maxOutputTokens: 300,
    },
  });

  const reply =
    result?.text ||
    result?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";

  if (!reply.trim()) {
    throw new Error("Empty reply from model");
  }

  return { reply: reply.trim() };
}

async function streamChatReply({ message, history = [], onChunk }) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required");
  }

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
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.6,
            maxOutputTokens: 220,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Gemini request timed out")),
            ATTEMPT_TIMEOUT_MS
          )
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
        /UNAVAILABLE|RESOURCE_EXHAUSTED|timed out/.test(String(err?.message || ""));

      console.error(`streamChatReply attempt ${attempt} failed:`, err?.message || err);

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