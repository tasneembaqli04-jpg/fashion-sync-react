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

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "בקשת הצ'אט נכשלה");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunkText = decoder.decode(value, { stream: true });
    if (chunkText) {
      fullText += chunkText;
      if (onChunk) onChunk(fullText);
    }
  }

  if (!fullText.trim()) {
    throw new Error("לא התקבלה תשובה");
  }

  return fullText.trim();
}