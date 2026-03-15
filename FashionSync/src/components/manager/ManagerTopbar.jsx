import styles from "../../styles/Manager.module.scss";

const titles = {
  overview: "סקירה כללית",
  inventory: "ניהול מלאי",
  alerts: "התראות",
  tasks: "משימות לעובדים",
  receipts: "קבלות מכירה",
  analytics: "אנליטיקה",
  settings: "הגדרות",
};

export default function ManagerTopbar({
  activeView,
  globalSearch,
  onSearchChange,
  onOpenSidebar,
  onRefresh,
  onOpenAddProduct,
  onOpenScan,
}) {
  return (
    <div className={styles.topbar}>
      <button className={styles.mobMenuBtn} onClick={onOpenSidebar}>
        <span />
        <span />
        <span />
      </button>

      <div className={styles.topbarTitle}>{titles[activeView]}</div>

      <div className={styles.topbarSearch}>
        <span style={{ color: "var(--muted)" }}>🔍</span>

        <input
          type="text"
          placeholder="חיפוש..."
          value={globalSearch}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <button
          onClick={onOpenScan}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
            fontSize: "1rem",
            padding: "0 0.2rem",
            lineHeight: 1,
            flexShrink: 0,
          }}
          title="סריקה"
        >
          📷
        </button>
      </div>

      <div className={styles.tbRight}>
        <button className={styles.btnGhost} onClick={onRefresh}>
          🔄
        </button>

        <button className={styles.btnGold} onClick={onOpenAddProduct}>
          + מוצר
        </button>
      </div>
    </div>
  );
}