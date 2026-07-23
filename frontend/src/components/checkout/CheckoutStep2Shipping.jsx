import styles from "../../styles/checkout/CheckoutForms.module.scss";
import CheckoutPriceBox from "./CheckoutPriceBox";
import { getShippingCost } from "../../functions/checkout/checkoutPricing";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CheckoutStep2Shipping({
  shippingOptions = [],
  selectedShipping,
  onSelectShipping,
  deliveryText,
  subtotal = 0,
  discount = 0,
  pointsDiscount = 0,
  giftCardDiscount = 0,
  shippingCost = 0,
  total = 0,
  onBack,
  onNext,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.checkout.step2;

  return (
    <div className={styles.stepPanel}>
      <div className={styles.card}>
        <div className={styles.secTitle}>{t.chooseShippingTitle}</div>

        <div className={styles.shipOptWrap}>
          {shippingOptions.map((option) => {
            const isSelected = selectedShipping?.id === option.id;
            const displayPrice = getShippingCost(option, subtotal);
            const optionT = dict.shippingOptionLabels[option.id] || option;

            return (
              <div
                key={option.id}
                className={`${styles.shipOpt} ${isSelected ? styles.selected : ""}`}
                onClick={() => onSelectShipping(option.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectShipping(option.id);
                  }
                }}
              >
                <span className={styles.shipIcon}>{option.icon}</span>

                <div className={styles.shipInfo}>
                  <div className={styles.shipLabel}>{optionT.label}</div>
                  <div className={styles.shipSub}>
                    {optionT.days}
                    {optionT.note ? ` · ${optionT.note}` : ""}
                  </div>
                </div>

                <div className={styles.shipPrice}>
                  {displayPrice === 0 ? t.free : `₪${displayPrice}`}
                </div>

                <div className={styles.radioDot}></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.secTitle}>{t.deliveryEstimateTitle}</div>
        <div className={styles.deliveryEstimate}>{deliveryText}</div>
      </div>

      <CheckoutPriceBox
        subtotal={subtotal}
        discount={discount}
        pointsDiscount={pointsDiscount}
        giftCardDiscount={giftCardDiscount}
        shipping={shippingCost}
        total={total}
      />

      <div className={styles.btnRow}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={onBack}
        >
          {t.backButton}
        </button>

        <button
          type="button"
          className={`${styles.btn} ${styles.btnGold}`}
          onClick={onNext}
        >
          {t.continueButton}
        </button>
      </div>
    </div>
  );
}