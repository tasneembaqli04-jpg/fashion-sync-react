import styles from "../../styles/checkout/CheckoutSuccess.module.scss";
export default function CheckoutStep4Success({
  isCash = false,
  isGiftCardOnly = false,
  email = "",
  receiptId = "",
  items = [],
  shippingCost = 0,
  discount = 0,
  total = 0,
  onBackToStore,
  onPrint,
}) {
  return (
    <div className={styles.stepPanel}>
      <div className={styles.successWrap}>
        <div className={styles.successCircle}>
          {isGiftCardOnly ? "🎁" : isCash ? "🕐" : "✅"}
        </div>

        <div className={styles.successTitle}>
          {isGiftCardOnly
            ? "כרטיס המתנה נרכש בהצלחה!"
            : isCash
              ? "ההזמנה נשמרה!"
              : "ההזמנה בוצעה!"}
        </div>

        <div className={styles.successSub}>
          {isGiftCardOnly
            ? "פרטי הרכישה קשורים לחשבון:"
            : isCash
              ? "הזמנתך נשמרה בהצלחה."
              : "אישור הזמנה נשלח לאימייל:"}
        </div>

        <div className={styles.successSubGold}>
          {isCash && !isGiftCardOnly ? "תשלום יבוצע בעת האיסוף מהחנות" : email}
        </div>

        <div className={styles.receiptNum}>
          🧾 מספר {isGiftCardOnly ? "רכישה" : "הזמנה"}: {receiptId}
        </div>

        <div className={`${styles.card} ${styles.successOrderBox}`}>
          <div className={styles.secTitle}>📋 פרטי ההזמנה</div>

          <div>
            {items.map((item) => (
              <div key={`${item.code}-${item.size}-${item.color}`} className={styles.successItemRow}>
                <img src={item.img} alt={item.name} />

                <div className={styles.successItemInfo}>
                  <div className={styles.successItemName}>{item.name}</div>
                  <div className={styles.successItemMeta}>
                    {[item.size, item.color].filter(Boolean).join(" · ")} × {item.qty}
                  </div>
                  {item.isGiftCard && (
                    <div
                      style={{
                        marginTop: "0.4rem",
                        padding: "0.4rem 0.7rem",
                        borderRadius: "8px",
                        border: "1px dashed var(--gold)",
                        color: "var(--gold)",
                        fontWeight: 900,
                        fontSize: "0.9rem",
                        display: "inline-block",
                      }}
                    >
                      🎁 קוד כרטיס המתנה: {item.code}
                    </div>
                  )}
                </div>

                <div className={styles.successItemPrice}>
                  ₪{(item.price * item.qty).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.successDivider}></div>

          <div className={styles.pline}>
            <span className={styles.pl}>משלוח</span>
            <span>{shippingCost === 0 ? "חינם ✨" : `₪${shippingCost}`}</span>
          </div>

          {discount > 0 && (
            <div className={`${styles.pline} ${styles.disc}`}>
              <span className={styles.pl}>הנחה</span>
              <span>−₪{discount.toLocaleString()}</span>
            </div>
          )}

          <div className={`${styles.pline} ${styles.total}`}>
            <span className={styles.pl}>
              {isCash ? 'לתשלום בחנות' : 'סה"כ ששולם'}
            </span>
            <span>₪{total.toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.successBtns}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={onBackToStore}
          >
            ← חזרה לחנות
          </button>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnGold}`}
            onClick={onPrint}
          >
            🖨️ הדפס קבלה
          </button>
        </div>
      </div>
    </div>
  );
}