import styles from "../../styles/checkout/CheckoutPayment.module.scss";

export default function CheckoutPriceBox({
  subtotal = 0,
  discount = 0,
  shipping = 0,
  total = 0,
  payMethod = "card",
  installments = 1,
}) {
  const showInstallments = payMethod === "card" && installments > 1;
  const monthlyPayment = showInstallments ? Math.ceil(total / installments) : 0;

  return (
    <div className={styles.priceBox}>
      <div className={styles.pline}>
        <span className={styles.pl}>סכום ביניים</span>
        <span>₪{subtotal.toLocaleString()}</span>
      </div>

      {discount > 0 && (
        <div className={`${styles.pline} ${styles.disc}`}>
          <span className={styles.pl}>הנחה</span>
          <span>−₪{discount.toLocaleString()}</span>
        </div>
      )}

      <div className={styles.pline}>
        <span className={styles.pl}>משלוח</span>
        <span>{shipping === 0 ? "חינם ✨" : `₪${shipping.toLocaleString()}`}</span>
      </div>

      {showInstallments && (
        <div className={styles.pline}>
          <span className={styles.pl}>תשלומים</span>
          <span>
            {installments} × ₪{monthlyPayment.toLocaleString()}
          </span>
        </div>
      )}

      <div className={`${styles.pline} ${styles.total}`}>
        <span className={styles.pl}>סה"כ לתשלום</span>
        <span>₪{total.toLocaleString()}</span>
      </div>
    </div>
  );
}