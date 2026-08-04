import { useEffect, useRef, useState } from "react";
import commonStyles from "../../styles/customer/Customer.module.scss";
import chatStyles from "../../styles/customer/CustomerChat.module.scss";
import OutfitProductsCatalog from "./OutfitProductsCatalog";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CustomerChat({
  chatMessages = [],
  sendMsg,
  quickMsg,
  toggleMoreQuestions,
  moreQuestionsOpen,
  chatInput,
  setChatInput,
  onChatImageChange,
  isTyping = false,
  addToCart,
  openProductModal,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.chat;
  const msgsRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div>
      <div className={commonStyles.pageTitle}>{t.pageTitle}</div>
      <div className={commonStyles.pageSub}>{t.pageSub}</div>

      <div
        className={`${chatStyles.chatShell} ${
          isFullscreen ? chatStyles.chatShellFullscreen : ""
        }`}
      >
        <div className={chatStyles.chatTop}>
          <div className={chatStyles.chatAvatar}>F</div>
          <div>
            <div className={chatStyles.chatBotName}>{t.botName}</div>
            <div className={chatStyles.chatOnline}>{t.onlineStatus}</div>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-label={isFullscreen ? t.exitFullscreen : t.enterFullscreen}
            style={{
              marginInlineStart: "auto",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text)",
              padding: "0.4rem 0.6rem",
              cursor: "pointer",
              fontSize: "1rem",
              lineHeight: 1,
            }}
          >
            {isFullscreen ? "✕" : "⛶"}
          </button>
        </div>

        <div className={chatStyles.chatMsgs} ref={msgsRef}>
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`${chatStyles.msg} ${
                msg.type === "user" ? chatStyles.userMsg : chatStyles.botMsg
              }`}
            >
              {msg.html && (
                <div dangerouslySetInnerHTML={{ __html: msg.html }} />
              )}

              {msg.imageUrl && (
                <div className={chatStyles.generatedImageWrapper}>
                  <img
                    src={msg.imageUrl}
                    alt={t.generatedImageAlt}
                    className={chatStyles.generatedImage}
                  />
                </div>
              )}
              {msg.products?.length > 0 && (
                <OutfitProductsCatalog
                  products={msg.products}
                  openProductModal={openProductModal}
                  title={msg.imageUrl ? t.outfitItemsTitle : t.matchingProductsTitle}
                />
              )}
            </div>
          ))}

          {isTyping && (
            <div className={`${chatStyles.msg} ${chatStyles.botMsg}`}>
              <span className={chatStyles.typingDots}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          )}
        </div>

        <div className={chatStyles.chatBottom}>
          <button className={chatStyles.sendBtn} onClick={sendMsg}>
            ➤
          </button>
          <label className={chatStyles.attachBtn} title={t.attachImageTitle}>
            📎
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={onChatImageChange}
            />
          </label>
          <textarea
            className={chatStyles.chatIn}
            placeholder={t.messagePlaceholder}
            rows="1"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMsg();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}