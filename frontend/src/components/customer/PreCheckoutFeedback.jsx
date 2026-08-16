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
  continueToCheckout,
  closeToCart,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.preCheckoutFeedback;

  // Escape matches the ✕, not the main button. Both are ways of saying "not
  // now", and dismissing a dialog should leave the customer where she came
  // from — the cart — rather than carrying her forward to payment, which is
  // the one thing a dismissal should never do on its own.
  const { dialogRef, dialogProps, titleProps } = useModalA11y({
    isOpen: open,
    onClose: closeToCart,
  });

  return (
    <div
      className={modalStyles.preCheckoutFeedback}
      id="pre-checkout-feedback"
      style={{ display: open ? "flex" : "none" }}
    >
      <div ref={dialogRef} {...dialogProps} className={modalStyles.pcfBox}>
        {/*
          Two ways out, because there are two intentions: the button below
          continues to payment, this returns to the cart. Without it, a
          customer who changed her mind about the purchase had no way to say
          so from here.
        */}
        <button
          type="button"
          className={modalStyles.modalClose}
          onClick={closeToCart}
          aria-label={t.backToCart}
        >
          ✕
        </button>

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

        {/*
          One button, not two. Both used to lead to checkout, which left the
          customer choosing between them at the moment she wants to pay. What
          she filled in decides whether anything is sent.
        */}
        <div className={modalStyles.pcfActions}>
          <button
            type="button"
            className={`${baseStyles.btn} ${baseStyles.btnGold}`}
            onClick={continueToCheckout}
          >
            {t.submitButton}
          </button>
        </div>

        {/*
          Says the rating is optional. Without it a single button above a set
          of stars reads as a form to complete, and a customer who does not
          want to rate has no way of knowing she can simply carry on.
        */}
        <div className={modalStyles.pcfHint}>{t.optionalHint}</div>
      </div>
    </div>
  );
}