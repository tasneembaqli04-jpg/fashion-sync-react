const CHAT_URL =
  import.meta.env.VITE_CHAT_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/chat";

export async function requestChatReplyStream({
  message,
  history = [],
  onChunk,
  signal,
}) {
  if (!message || !message.trim()) {
    throw new Error("לא הוזנה הודעה");
  }

  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
    }),
    signal,
  });

  const contentType =
    response.headers.get("content-type") || "";

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);

      throw new Error(
        data?.message ||
          data?.error ||
          "בקשת הצ'אט נכשלה"
      );
    }

    const errorText = await response.text().catch(() => "");

    throw new Error(
      errorText || "בקשת הצ'אט נכשלה"
    );
  }

  if (contentType.includes("application/json")) {
    const data = await response.json();

    if (
      data?.responseMode === "IMAGE" &&
      data?.imageGenerated === true &&
      data?.image?.dataUrl
    ) {
      return {
        responseMode: "IMAGE",
        imageGenerated: true,
        image: data.image,
        products: data.products || [],
        intent: data.intent || null,
      };
    }

    return {
      responseMode: data?.responseMode || "TEXT",
      ...data,
    };
  }

  if (!response.body) {
    throw new Error("לא התקבלה תשובה");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const chunkText = decoder.decode(value, {
      stream: true,
    });

    if (chunkText) {
      fullText += chunkText;

      if (onChunk) {
        onChunk(fullText);
      }
    }
  }

  fullText += decoder.decode();

  if (!fullText.trim()) {
    throw new Error("לא התקבלה תשובה");
  }

  return {
    responseMode: "TEXT",
    text: fullText.trim(),
  };
}