import styles from "../../styles/checkout/CheckoutTopbar.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";
export default function CheckoutTopbar() {
  const { t: dict } = useLanguage();
  const t = dict.customer.checkout;

  return (
    <div className={styles.topbar}>
      <div className={styles.brand}>FashionSync</div>
      <div className={styles.topbarRight}>{t.secureBadge}</div>
    </div>
  );
}