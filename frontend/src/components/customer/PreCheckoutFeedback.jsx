import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";

export default function PreCheckoutFeedback({
  open = false,
  pcfRating = 0,
  pcfText = "",
  selectedTopics = [],
  setPcfRating,
  setPcfText,
  togglePcfTopic,
  submitPreCheckoutFeedback,
  skipToCheckout,
}) {
  const topics = [
    "🎨 עיצוב",
    "🔍 חיפוש",
    "🛒 קנייה",
    "📱 מובייל",
    "💬 צ'אטבוט",
    "💡 הצעה",
  ];

  return (
    <div
      className={modalStyles.preCheckoutFeedback}
      id="pre-checkout-feedback"
      style={{ display: open ? "flex" : "none" }}
    >
      <div className={modalStyles.pcfBox}>
        <div className={modalStyles.pcfTitle}>💡 לפני שאתה משלם...</div>

        <div className={modalStyles.pcfSub}>
          יש לך הצעות לשיפור האתר? נשמח לשמוע! (אפשר לדלג)
        </div>

        <div className={modalStyles.pcfStars} id="pcf-stars-row">
          {[1, 2, 3, 4, 5].map((value) => (
            <span
              key={value}
              className={`${modalStyles.pcfStar} ${
                pcfRating >= value ? modalStyles.starOn : ""
              }`}
              onClick={() => setPcfRating(value)}
            >
              ⭐
            </span>
          ))}
        </div>

        <div className={modalStyles.pcfTopics} id="pcf-topics">
          {topics.map((topic) => (
            <button
              key={topic}
              type="button"
              className={`${modalStyles.pcfTopic} ${
                selectedTopics.includes(topic)
                  ? modalStyles.selectedTopic
                  : ""
              }`}
              onClick={() => togglePcfTopic(topic)}
            >
              {topic}
            </button>
          ))}
        </div>

        <textarea
          className={modalStyles.pcfTextarea}
          id="pcf-text"
          placeholder="כתוב הערה כלשהי... (לא חובה)"
          value={pcfText}
          onChange={(e) => setPcfText(e.target.value)}
        />

        <div className={modalStyles.pcfActions}>
          <button
            type="button"
            className={`${baseStyles.btn} ${baseStyles.btnGold}`}
            onClick={submitPreCheckoutFeedback}
          >
            שלח וקדם לתשלום ←
          </button>

          <button
            type="button"
            className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
            onClick={skipToCheckout}
          >
            דלג ועבור לתשלום
          </button>
        </div>
      </div>
    </div>
  );
}