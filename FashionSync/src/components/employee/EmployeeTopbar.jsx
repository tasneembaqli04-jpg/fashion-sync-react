import styles from "../../styles/employee/EmployeeTopbar.module.scss";

export default function EmployeeTopbar({
  currentUser,
  onToggleSidebar,
  onShowPanel,
  onOpenScan,
  onOpenNewProduct,
  onRefresh,
}) {
  return (
    <div className={`${styles.topbar} ${styles.visible}`}>
      <button className={styles.hamburger} onClick={onToggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      <button
        className={`${styles.quickBtn} ${styles.qbSell}`}
        onClick={() => onShowPanel("sell")}
      >
        🏷️ <span className={styles.qbLabel}>מכירה</span>
      </button>

      <button
        className={`${styles.quickBtn} ${styles.qbScan}`}
        onClick={() => onOpenScan("inventory")}
      >
        📷 <span className={styles.qbLabel}>ברקוד</span>
      </button>

      <button
        className={`${styles.quickBtn} ${styles.qbInventory}`}
        onClick={() => onShowPanel("inventory")}
      >
        📦 <span className={styles.qbLabel}>מלאי</span>
      </button>

      <button
        className={`${styles.quickBtn} ${styles.qbNewprod}`}
        onClick={onOpenNewProduct}
      >
        ➕ <span className={styles.qbLabel}>מוצר חדש</span>
      </button>

      <div className={styles.topbarSep}></div>

      <button
        className={`${styles.quickBtn} ${styles.qbRefresh}`}
        onClick={onRefresh}
        title="רענן"
      >
        🔄
      </button>

      <span className={styles.topbarGreeting}>
        <strong>{currentUser?.name || "—"}</strong>
      </span>
    </div>
  );
}
