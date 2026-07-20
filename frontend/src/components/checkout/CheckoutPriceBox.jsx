import styles from "../../styles/checkout/CheckoutPayment.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CheckoutPriceBox({
  subtotal = 0,
  discount = 0,
  pointsDiscount = 0,
  shipping = 0,
  total = 0,
  payMethod = "card",
  installments = 1,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.checkout.priceBox;
  const showInstallments = payMethod === "card" && installments > 1;
  const monthlyPayment = showInstallments ? Math.ceil(total / installments) : 0;

  return (
    <div className={styles.priceBox}>
      <div className={styles.pline}>
        <span className={styles.pl}>{t.subtotal}</span>
        <span>₪{subtotal.toLocaleString()}</span>
      </div>

      {discount > 0 && (
        <div className={`${styles.pline} ${styles.disc}`}>
          <span className={styles.pl}>{t.discount}</span>
          <span>−₪{discount.toLocaleString()}</span>
        </div>
      )}

      {pointsDiscount > 0 && (
        <div className={`${styles.pline} ${styles.disc}`}>
          <span className={styles.pl}>{t.pointsDiscount}</span>
          <span>−₪{pointsDiscount.toFixed(2)}</span>
        </div>
      )}

      <div className={styles.pline}>
        <span className={styles.pl}>{t.shipping}</span>
        <span>{shipping === 0 ? t.freeShipping : `₪${shipping.toLocaleString()}`}</span>
      </div>

      {showInstallments && (
        <div className={styles.pline}>
          <span className={styles.pl}>{t.installments}</span>
          <span>
            {installments} × ₪{monthlyPayment.toLocaleString()}
          </span>
        </div>
      )}

      <div className={`${styles.pline} ${styles.total}`}>
        <span className={styles.pl}>{t.total}</span>
        <span>₪{total.toLocaleString()}</span>
      </div>
    </div>
  );
}