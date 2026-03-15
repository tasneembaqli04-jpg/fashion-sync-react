import styles from "../../styles/Manager.module.scss";

export default function ManagerTopbar({
  title,
  globalSearch,
  onGlobalSearchChange,
  onRefresh,
  onAddProductClick,
  onOpenMobileSidebar,
}) {
  return (
    <div className={styles.topbar}>
      <button className={styles.mobMenuBtn} onClick={onOpenMobileSidebar}>
        ☰
      </button>

      <div className={styles.topbarTitle}>{title}</div>

      <div className={styles.topbarSearch}>
        <span style={{ color: "var(--muted)" }}>🔍</span>
        <input
          type="text"
          placeholder="חיפוש..."
          value={globalSearch}
          onChange={(e) => onGlobalSearchChange(e.target.value)}
        />
      </div>

      <div className={styles.tbRight}>
        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onRefresh}>
          🔄 רענן
        </button>

        <button className={`${styles.btn} ${styles.btnGold}`} onClick={onAddProductClick}>
          + מוצר חדש
        </button>
      </div>
    </div>
  );
}
