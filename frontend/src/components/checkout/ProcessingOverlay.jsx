import styles from "../../styles/checkout/Checkout.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function ProcessingOverlay({ isOpen }) {
  const { t: dict } = useLanguage();
  const t = dict.customer.processing;

  return (
    <div
      className={`${styles.processingOverlay} ${isOpen ? styles.show : ""}`}
    >
      <div className={styles.spinner}></div>
      <div className={styles.procText}>{t.text}</div>
      <div className={styles.procSub}>{t.sub}</div>
    </div>
  );
}