import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";

export default function PostOrderFeedback({
  open = false,
  feedbackRating = 0,
  feedbackText = "",
  selectedTopics = [],
  submitted = false,
  setFeedbackRating,
  setFeedbackText,
  toggleTopic,
  closeFeedbackModal,
  submitFeedback,
}) {
  const topics = [
    "🎨 עיצוב האתר",
    "🔍 חיפוש מוצרים",
    "🛒 תהליך הרכישה",
    "📱 חוויית מובייל",
    "💬 הצ'אטבוט",
    "📷 נסה עליי",
    "💡 הצעה לשיפור",
  ];

  return (
    <div
      className={`${modalStyles.feedbackModalWrap} ${
        open ? modalStyles.open : ""
      }`}
      id="feedback-modal"
    >
      <div className={modalStyles.feedbackModalBox}>
        {!submitted ? (
          <div id="feedback-form-content">
            <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎉</div>
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "1.6rem",
                  color: "var(--gold)",
                  marginBottom: "0.3rem",
                }}
              >
                תודה על הרכישה!
              </div>
              <div style={{ color: "var(--light-gray)", fontSize: "0.88rem" }}>
                נשמח לשמוע מה חשבת
              </div>
            </div>

            <div className={modalStyles.feedbackStars} id="feedback-stars-row">
              {[1, 2, 3, 4, 5].map((value) => (
                <span
                  key={value}
                  className={`${modalStyles.feedbackStar} ${
                    feedbackRating >= value ? modalStyles.on : ""
                  }`}
                  data-v={value}
                  onClick={() => setFeedbackRating(value)}
                >
                  ⭐
                </span>
              ))}
            </div>

            <div className={modalStyles.feedbackTopics} id="feedback-topics">
              {topics.map((topic) => (
                <button
                  key={topic}
                  className={`${modalStyles.feedbackTopic} ${
                    selectedTopics.includes(topic) ? modalStyles.selected : ""
                  }`}
                  onClick={() => toggleTopic(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>

            <textarea
              className={modalStyles.feedbackTextarea}
              id="feedback-text"
              placeholder="ספר לנו מה אהבת, מה פחות, ומה היית משנה..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <button
                className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
                onClick={closeFeedbackModal}
              >
                דלג
              </button>

              <button
                className={`${baseStyles.btn} ${baseStyles.btnGold}`}
                onClick={submitFeedback}
              >
                📨 שלח
              </button>
            </div>
          </div>
        ) : (
          <div
            id="feedback-success-content"
            className={modalStyles.feedbackSuccess}
          >
            <div className="fs-icon">🙏</div>
            <h3>תודה על המשוב!</h3>
            <p>ההערות שלך חשובות לנו מאוד.</p>
            <button
              className={`${baseStyles.btn} ${baseStyles.btnGold}`}
              style={{ marginTop: "1.5rem" }}
              onClick={closeFeedbackModal}
            >
              סגור
            </button>
          </div>
        )}
      </div>
    </div>
  );
}