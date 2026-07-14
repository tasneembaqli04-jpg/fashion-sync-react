import styles from "../../styles/checkout/Checkout.module.scss";
export default function ProcessingOverlay({ isOpen }) {
  return (
    <div
      className={`${styles.processingOverlay} ${isOpen ? styles.show : ""}`}
    >
      <div className={styles.spinner}></div>
      <div className={styles.procText}>מעבד תשלום...</div>
      <div className={styles.procSub}>אנא המתן, אל תסגור את הדף</div>
    </div>
  );
}