import { useEffect, useRef, useState } from "react";
import commonStyles from "../../styles/customer/Customer.module.scss";
import chatStyles from "../../styles/customer/CustomerChat.module.scss";
import OutfitProductsCatalog from "./OutfitProductsCatalog";

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
  const msgsRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div>
      <div className={commonStyles.pageTitle}>💬 צ'אטבוט FashionSync</div>
      <div className={commonStyles.pageSub}>
        שאל אותנו כל שאלה על החנות, מוצרים ומבצעים
      </div>

      <div
        className={`${chatStyles.chatShell} ${
          isFullscreen ? chatStyles.chatShellFullscreen : ""
        }`}
      >
        <div className={chatStyles.chatTop}>
          <div className={chatStyles.chatAvatar}>F</div>
          <div>
            <div className={chatStyles.chatBotName}>SYNC – עוזר החנות</div>
            <div className={chatStyles.chatOnline}>● מחובר ומוכן לעזור</div>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-label={isFullscreen ? "צא ממסך מלא" : "הרחב למסך מלא"}
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
                <div
                  dangerouslySetInnerHTML={{
                    __html: msg.html,
                  }}
                />
              )}

              {msg.imageUrl && (
                <div className={chatStyles.generatedImageWrapper}>
                  <img
                    src={msg.imageUrl}
                    alt="המחשת לוק שנוצרה על ידי SYNC"
                    className={chatStyles.generatedImage}
                  />
                </div>
              )}
              {msg.products?.length > 0 && (
                <OutfitProductsCatalog
                  products={msg.products}
                  openProductModal={openProductModal}
                  title={msg.imageUrl ? "הפריטים בלוק" : "מוצרים מתאימים"}
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
          <label className={chatStyles.attachBtn} title="שלח תמונה">
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
            placeholder="כתוב הודעה..."
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