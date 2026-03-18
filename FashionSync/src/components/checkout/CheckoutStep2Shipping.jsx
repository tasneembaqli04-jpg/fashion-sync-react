import styles from "../../styles/checkout/CheckoutForms.module.scss";
import CheckoutPriceBox from "./CheckoutPriceBox";

export default function CheckoutStep2Shipping({
  shippingOptions = [],
  selectedShipping,
  onSelectShipping,
  deliveryText,
  subtotal = 0,
  discount = 0,
  shippingCost = 0,
  total = 0,
  onBack,
  onNext,
}) {
  return (
    <div className={styles.stepPanel}>
      <div className={styles.card}>
        <div className={styles.secTitle}>🚚 בחר שיטת משלוח</div>

        <div className={styles.shipOptWrap}>
          {shippingOptions.map((option) => {
            const isSelected = selectedShipping?.id === option.id;

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
                  <div className={styles.shipLabel}>{option.label}</div>
                  <div className={styles.shipSub}>
                    {option.days}
                    {option.note ? ` · ${option.note}` : ""}
                  </div>
                </div>

                <div className={styles.shipPrice}>
                  {option.price === 0 && option.id !== "pickup"
                    ? "חינם"
                    : `₪${option.price}`}
                </div>

                <div className={styles.radioDot}></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.secTitle}>📅 תאריך אספקה משוער</div>
        <div className={styles.deliveryEstimate}>{deliveryText}</div>
      </div>

      <CheckoutPriceBox
        subtotal={subtotal}
        discount={discount}
        shipping={shippingCost}
        total={total}
      />

      <div className={styles.btnRow}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={onBack}
        >
          ← חזרה
        </button>

        <button
          type="button"
          className={`${styles.btn} ${styles.btnGold}`}
          onClick={onNext}
        >
          המשך לתשלום ←
        </button>
      </div>
    </div>
  );
}