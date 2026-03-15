import styles from "../../styles/Manager.module.scss";

export default function ManagerSidebar({
  activeView,
  onChangeView,
  onLogout,
  onGoHome,
  onToggleTheme,
  theme,
  alertCount,
  taskCount,
  mobileOpen,
}) {
  return (
    <aside
      className={`${styles.sidebar} ${
        mobileOpen ? "" : styles.mobHidden
      }`}
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

        <button
          className={`${styles.navBtn} ${
            activeView === "tasks" ? styles.active : ""
          }`}
          onClick={() => onChangeView("tasks")}
        >
          <span className={styles.icon}>📋</span>
          <span style={{ flex: 1 }}>משימות לעובדים</span>
          {taskCount > 0 && (
            <span
              style={{
                background: "var(--blue)",
                color: "#fff",
                fontSize: ".6rem",
                fontWeight: 900,
                padding: ".05rem .45rem",
                borderRadius: "10px",
                marginRight: ".1rem",
              }}
            >
              {taskCount}
            </span>
          )}
        </button>

        <div className={styles.sbSec}>מכירות</div>

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
          <span className={styles.icon}>
            {theme === "light" ? "☀️" : "🌙"}
          </span>
          <span>{theme === "light" ? "מצב כהה" : "מצב כהה/בהיר"}</span>
        </button>

        <button className={styles.navBtn} onClick={onGoHome}>
          <span className={styles.icon}>🏠</span>
          דף הבית
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
