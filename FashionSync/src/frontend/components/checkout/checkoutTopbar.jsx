import styles from "../../styles/checkout/CheckoutTopbar.module.scss";
export default function CheckoutTopbar() {
  return (
    <div className={styles.topbar}>
      <div className={styles.brand}>FashionSync</div>
      <div className={styles.topbarRight}>🔒 תשלום מאובטח</div>
    </div>
  );
}