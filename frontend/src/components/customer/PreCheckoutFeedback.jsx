import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import { useModalA11y } from "../../hooks/useModalA11y";
import baseStyles from "../../styles/customer/Customer.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function PreCheckoutFeedback({
  open = false,
  pcfRating = 0,
  pcfText = "",
  setPcfRating,
  setPcfText,
  submitPreCheckoutFeedback,
  skipToCheckout,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.preCheckoutFeedback;
  const { dialogRef, dialogProps, titleProps } = useModalA11y({
    isOpen: open,
    onClose: skipToCheckout,
  });

  return (
    <div
      className={modalStyles.preCheckoutFeedback}
      id="pre-checkout-feedback"
      style={{ display: open ? "flex" : "none" }}
    >
      <div ref={dialogRef} {...dialogProps} className={modalStyles.pcfBox}>
        {/*
          One heading rather than a title and a subtitle. The two buttons below
          already say "payment" twice, so the question does not repeat it.
        */}
        <div className={modalStyles.pcfTitle}><span {...titleProps}>{t.title}</span></div>

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