import styles from "../../styles/manager/ManagerSidebar.module.scss";
export default function ManagerSidebar({
  activeView,
  onChangeView,
  onLogout,
  onGoHome,
  onToggleTheme,
  theme,
  alertCount,
  mobileOpen,
}) {
  return (
    <aside
      className={`${styles.sidebar} ${mobileOpen ? "" : styles.mobHidden}`}
    >
      <div className={styles.sbBrand}>
        <div className={styles.sbLogo}>FashionSync</div>
        <div className={styles.sbRole}>מנהל ראשי</div>
      </div>

      <nav className={styles.sbNav}>
        <div className={styles.sbSec}>ראשי</div>

        <button
          className={`${styles.navBtn} ${
            activeView === "overview" ? styles.active : ""
          }`}
          onClick={() => onChangeView("overview")}
        >
          <span className={styles.icon}>📊</span>
          סקירה כללית
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "inventory" ? styles.active : ""
          }`}
          onClick={() => onChangeView("inventory")}
        >
          <span className={styles.icon}>👗</span>
          ניהול מלאי
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "alerts" ? styles.active : ""
          }`}
          onClick={() => onChangeView("alerts")}
        >
          <span className={styles.icon}>🔔</span>
          <span style={{ flex: 1 }}>התראות</span>
          {alertCount > 0 && <div className={styles.navDot} />}
        </button>

        <div className={styles.sbSec}>מכירות</div>
        <button
          className={`${styles.navBtn} ${
            activeView === "orders" ? styles.active : ""
          }`}
          onClick={() => onChangeView("orders")}
        >
          <span className={styles.icon}>📦</span>
          הזמנות לקוחות
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "deliveries" ? styles.active : ""
          }`}
          onClick={() => onChangeView("deliveries")}
        >
          <span className={styles.icon}>🚚</span>
          מעקב משלוחים
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "receipts" ? styles.active : ""
          }`}
          onClick={() => onChangeView("receipts")}
        >
          <span className={styles.icon}>🧾</span>
          קבלות מכירה
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "analytics" ? styles.active : ""
          }`}
          onClick={() => onChangeView("analytics")}
        >
          <span className={styles.icon}>📉</span>
          אנליטיקה
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "feedback" ? styles.active : ""
          }`}
          onClick={() => onChangeView("feedback")}
        >
          <span className={styles.icon}>💬</span>
          משוב לקוחות
        </button>

        <div className={styles.sbSec}>הגדרות</div>

        <button
          className={`${styles.navBtn} ${
            activeView === "settings" ? styles.active : ""
          }`}
          onClick={() => onChangeView("settings")}
        >
          <span className={styles.icon}>⚙️</span>
          הגדרות
        </button>
      </nav>

      <div className={styles.sbFooter}>
        <button className={styles.navBtn} onClick={onToggleTheme}>
          <span className={styles.icon}>{theme === "light" ? "☀️" : "🌙"}</span>
          <span>{theme === "light" ? "מצב כהה/בהיר" : "מצב כהה/בהיר"}</span>
        </button>

        <button
          className={styles.navBtn}
          onClick={onLogout}
          style={{ color: "var(--red)" }}
        >
          <span className={styles.icon}>🚪</span>
          התנתק
        </button>
      </div>
    </aside>
  );
}
