import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

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
  const { t: dict } = useLanguage();
  const t = dict.customer.preCheckoutFeedback;

  const topics = [
    t.topicDesign,
    t.topicSearch,
    t.topicShopping,
    t.topicMobile,
    t.topicChatbot,
    t.topicSuggestion,
  ];

  return (
    <div
      className={modalStyles.preCheckoutFeedback}
      id="pre-checkout-feedback"
      style={{ display: open ? "flex" : "none" }}
    >
      <div className={modalStyles.pcfBox}>
        <div className={modalStyles.pcfTitle}>{t.title}</div>

        <div className={modalStyles.pcfSub}>
          {t.subtitle}
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
          placeholder={t.textPlaceholder}
          value={pcfText}
          onChange={(e) => setPcfText(e.target.value)}
        />

        <div className={modalStyles.pcfActions}>
          <button
            type="button"
            className={`${baseStyles.btn} ${baseStyles.btnGold}`}
            onClick={submitPreCheckoutFeedback}
          >
            {t.submitButton}
          </button>

          <button
            type="button"
            className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
            onClick={skipToCheckout}
          >
            {t.skipButton}
          </button>
        </div>
      </div>
    </div>
  );
}