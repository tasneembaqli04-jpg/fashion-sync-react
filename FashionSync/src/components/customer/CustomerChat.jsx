import { useEffect, useRef } from "react";
import commonStyles from "../../styles/customer/Customer.module.scss";
import chatStyles from "../../styles/customer/CustomerChat.module.scss";

export default function CustomerChat({
  chatMessages = [],
  sendMsg,
  quickMsg,
  toggleMoreQuestions,
  moreQuestionsOpen,
  chatInput,
  setChatInput,
  onChatImageChange,
}) {
  const msgsRef = useRef(null);

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

      <div className={chatStyles.chatShell}>
        <div className={chatStyles.chatTop}>
          <div className={chatStyles.chatAvatar}>F</div>
          <div>
            <div className={chatStyles.chatBotName}>SYNC – עוזר החנות</div>
            <div className={chatStyles.chatOnline}>● מחובר ומוכן לעזור</div>
          </div>
        </div>

        <div className={chatStyles.chatMsgs} ref={msgsRef}>
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`${chatStyles.msg} ${
                msg.type === "user" ? chatStyles.userMsg : chatStyles.botMsg
              }`}
              dangerouslySetInnerHTML={{ __html: msg.html }}
            />
          ))}
        </div>

        <div className={chatStyles.chatPills}>
          <button className={chatStyles.pill} onClick={() => quickMsg("שלום")}>שלום</button>
          <button className={chatStyles.pill} onClick={() => quickMsg("מה יש חדש בחנות?")}>מה חדש?</button>
          <button className={chatStyles.pill} onClick={() => quickMsg("יש מבצעים עכשיו?")}>מבצעים</button>
          <button className={chatStyles.pill} onClick={() => quickMsg("יש משלוחים?")}>משלוחים</button>
          <button className={chatStyles.pill} onClick={() => quickMsg("אפשר החזרה?")}>החזרות</button>
          <button className={chatStyles.pill} onClick={toggleMoreQuestions}>עוד שאלות</button>
        </div>

        {moreQuestionsOpen && (
          <div className={chatStyles.chatPills}>
            <button className={chatStyles.pill} onClick={() => quickMsg("מה המחירים?")}>מחירים</button>
            <button className={chatStyles.pill} onClick={() => quickMsg("מה שעות הפתיחה?")}>שעות פתיחה</button>
            <button className={chatStyles.pill} onClick={() => quickMsg("מה הכתובת?")}>כתובת</button>
            <button className={chatStyles.pill} onClick={() => quickMsg("יש חולצות?")}>חולצות</button>
            <button className={chatStyles.pill} onClick={() => quickMsg("יש מכנסיים?")}>מכנסיים</button>
            <button className={chatStyles.pill} onClick={() => quickMsg("יש שמלות?")}>שמלות</button>
            <button className={chatStyles.pill} onClick={() => quickMsg("יש עליוניות?")}>עליוניות</button>
            <button className={chatStyles.pill} onClick={() => quickMsg("יש מידות?")}>מידות</button>
            <button className={chatStyles.pill} onClick={() => quickMsg("יש צבעים?")}>צבעים</button>
            <button className={chatStyles.pill} onClick={() => quickMsg("איך עובדות הנקודות?")}>נקודות</button>
            <button className={chatStyles.pill} onClick={() => quickMsg("איך משלמים?")}>תשלום</button>
          </div>
        )}

        <div className={chatStyles.chatBottom}>
          <button className={chatStyles.sendBtn} onClick={sendMsg}>➤</button>
          <label className={chatStyles.attachBtn} title="שלח תמונה">
            📎
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={onChatImageChange} />
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