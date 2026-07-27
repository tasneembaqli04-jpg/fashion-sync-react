const CHAT_URL =
  import.meta.env.VITE_CHAT_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/chat";

export async function requestChatReplyStream({
  message,
  history = [],
  currentOutfit = [],
  currentOutfitImage = "",
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
      currentOutfit: Array.isArray(currentOutfit) ? currentOutfit : [],
      currentOutfitImage:
        typeof currentOutfitImage === "string" ? currentOutfitImage : "",
    }),
    signal,
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);

      throw new Error(data?.message || data?.error || "בקשת הצ'אט נכשלה");
    }

    const errorText = await response.text().catch(() => "");

    throw new Error(errorText || "בקשת הצ'אט נכשלה");
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

  let buffer = "";
  let fullText = "";
  let finalResult = null;

  function processLine(line) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return;
    }

    let event;

    try {
      event = JSON.parse(trimmedLine);
    } catch (error) {
      console.error("Failed to parse chat stream event:", trimmedLine, error);

      return;
    }

    if (event.type === "chunk") {
      fullText += event.text || "";

      if (onChunk) {
        onChunk(fullText);
      }

      return;
    }

    if (event.type === "result") {
      finalResult = event;
    }
  }

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, {
      stream: true,
    });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      processLine(line);
    }
  }

  buffer += decoder.decode();

  if (buffer.trim()) {
    processLine(buffer);
  }

  if (!fullText.trim() && !finalResult) {
    throw new Error("לא התקבלה תשובה");
  }

  return {
    responseMode: finalResult?.responseMode || "TEXT",

    text: fullText.trim(),

    products: Array.isArray(finalResult?.products) ? finalResult.products : [],

    intent: finalResult?.intent || null,

    imageGenerated: finalResult?.imageGenerated || false,

    error: finalResult?.error || null,
  };
}
