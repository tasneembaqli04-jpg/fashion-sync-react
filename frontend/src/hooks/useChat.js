import { useEffect, useState } from "react";
import { useLanguage } from "../translations/LanguageProvider";
import { getReply } from "../functions/customer/chat";
import { requestChatReplyStream } from "../services/chat/chatService";

/** How long to wait for the assistant before giving up on a reply. */
const CHAT_TIMEOUT_MS = 30000;

/**
 * Holds the shopping assistant: the conversation, and the request behind it.
 *
 * The reply streams in rather than arriving whole, which shapes the state.
 * The first chunk appends a bot message and clears the typing indicator; every
 * chunk after it rewrites that same last message with the fuller text. Once
 * the stream finishes, the final result can still add to it — product cards
 * are attached to the message already on screen rather than sent as a new one.
 *
 * An outfit image is the exception: it arrives complete, so it is appended as
 * its own message and kept aside, because a follow-up request needs to know
 * which outfit is being talked about.
 *
 * Two failures are told apart. A request that runs past the timeout is
 * aborted and says so, since the customer's question was understood and only
 * the answer is missing. Anything else falls back to a fixed reply pointing
 * at the other ways to get help. Neither is an error the customer caused, so
 * neither goes to the console as one.
 *
 * @returns {object} The conversation and the actions the chat panel binds to.
 */
export function useChat() {
  const { t: dict, lang } = useLanguage();

  const [chatInput, setChatInput] = useState("");
  const [moreQuestionsOpen, setMoreQuestionsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      type: "bot",
      html: dict.customer.chat.welcomeMessage,
      isWelcome: true,
    },
  ]);
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState([]);
  const [currentOutfitImage, setCurrentOutfitImage] = useState("");
  const [shownProductCodes, setShownProductCodes] = useState([]);

  // Switching language re-greets, but only while the greeting is all there is.
  // Once the customer has said anything, the conversation is left alone rather
  // than having its opening line rewritten underneath it.
  useEffect(() => {
    setChatMessages((prev) => {
      if (prev.length === 1 && prev[0].isWelcome) {
        return [
          {
            type: "bot",
            html: dict.customer.chat.welcomeMessage,
            isWelcome: true,
          },
        ];
      }
      return prev;
    });
  }, [lang]);

  function quickMsg(text) {
    setChatInput(text);
    setTimeout(() => sendMsg(text), 0);
  }

  async function sendMsg(forcedText) {
    const text = (forcedText ?? chatInput).trim();
    if (!text) return;

    setChatMessages((prev) => [
      ...prev,
      {
        type: "user",
        html: text,
      },
    ]);

    setChatInput("");
    setIsChatTyping(true);

    // Built before the append above lands, so it holds the conversation up to
    // but not including this question, which travels separately as `message`.
    const history = chatMessages.map((message) => ({
      role: message.type === "user" ? "user" : "bot",
      text: message.html || "",
    }));

    let botMessageStarted = false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, CHAT_TIMEOUT_MS);

    try {
      const result = await requestChatReplyStream({
        message: text,
        history,
        currentOutfit,
        currentOutfitImage,
        shownProductCodes,
        lang,
        signal: controller.signal,

        onChunk: (fullTextSoFar) => {
          if (!botMessageStarted) {
            botMessageStarted = true;
            setIsChatTyping(false);

            setChatMessages((prev) => [
              ...prev,
              {
                type: "bot",
                html: fullTextSoFar,
              },
            ]);
          } else {
            setChatMessages((prev) => {
              const next = [...prev];

              next[next.length - 1] = {
                type: "bot",
                html: fullTextSoFar,
              };

              return next;
            });
          }
        },
      });
      if (Array.isArray(result?.products) && result.products.length > 0) {
        const newCodes = result.products
          .map((product) => product?.code || product?.id)
          .filter(Boolean);

        setShownProductCodes((prev) => [...new Set([...prev, ...newCodes])]);
      }
      if (
        botMessageStarted &&
        result?.responseMode === "TEXT" &&
        Array.isArray(result?.products) &&
        result.products.length > 0
      ) {
        setChatMessages((prev) => {
          const next = [...prev];

          next[next.length - 1] = {
            ...next[next.length - 1],
            products: result.products,
          };

          return next;
        });
      }

      if (
        result?.responseMode === "IMAGE" &&
        result?.imageGenerated === true &&
        result?.image?.dataUrl
      ) {
        setCurrentOutfit(Array.isArray(result.products) ? result.products : []);
        setCurrentOutfitImage(result.image.dataUrl);
        setIsChatTyping(false);

        setChatMessages((prev) => [
          ...prev,
          {
            type: "bot",
            html: dict.customer.chat.outfitImageReady,
            imageUrl: result.image.dataUrl,
            imageMimeType: result.image.mimeType || "image/png",
            products: result.products || [],
          },
        ]);

        return;
      }

      if (
        result?.responseMode === "TEXT" &&
        result?.text &&
        !botMessageStarted
      ) {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "bot",
            html: result.text,
            products: result.products || [],
          },
        ]);
      }
    } catch (err) {
      console.warn(
        `Chat service unreachable, using the fallback reply: ${err.message}`,
      );

      if (err?.name === "AbortError") {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "bot",
            html: dict.customer.chat.requestTimedOut,
          },
        ]);

        return;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          type: "bot",
          html: getReply(dict),
        },
      ]);
    } finally {
      clearTimeout(timeoutId);
      setIsChatTyping(false);
    }
  }

  function toggleMoreQuestions() {
    setMoreQuestionsOpen((prev) => !prev);
  }

  return {
    chatMessages,
    chatInput,
    setChatInput,
    isChatTyping,
    moreQuestionsOpen,
    sendMsg,
    quickMsg,
    toggleMoreQuestions,
  };
}
