import styles from "../../styles/Manager.module.scss";

const navItems = [
  { id: "overview", label: "סקירה כללית", icon: "📊", section: "ראשי" },
  { id: "inventory", label: "ניהול מלאי", icon: "👗", section: "ראשי" },
  { id: "alerts", label: "התראות", icon: "🔔", section: "ראשי" },
  { id: "tasks", label: "משימות לעובדים", icon: "📋", section: "ראשי" },
  { id: "receipts", label: "קבלות מכירה", icon: "🧾", section: "מכירות" },
  { id: "analytics", label: "אנליטיקה", icon: "📉", section: "מכירות" },
  { id: "settings", label: "הגדרות", icon: "⚙️", section: "הגדרות" },
];

export default function ManagerSidebar({
  activeView,
  onChangeView,
  mobileSidebarOpen,
  theme,
  onToggleTheme,
  onGoHome,
  onLogout,
}) {
  return (
    <aside
      className={`${styles.sidebar} ${mobileSidebarOpen ? styles.mobOpen : ""}`}
    >
      <div className={styles.sbBrand}>
        <div className={styles.sbLogo}>FashionSync</div>
        <div className={styles.sbRole}>מנהל ראשי</div>
      </div>

      <nav className={styles.sbNav}>
        <div className={styles.sbSec}>ראשי</div>

        {navItems
          .filter((item) => item.section === "ראשי")
          .map((item) => (
            <button
              key={item.id}
              className={`${styles.navBtn} ${
                activeView === item.id ? styles.active : ""
              }`}
              onClick={() => onChangeView(item.id)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

        <div className={styles.sbSec}>מכירות</div>

        {navItems
          .filter((item) => item.section === "מכירות")
          .map((item) => (
            <button
              key={item.id}
              className={`${styles.navBtn} ${
                activeView === item.id ? styles.active : ""
              }`}
              onClick={() => onChangeView(item.id)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

        <div className={styles.sbSec}>הגדרות</div>

        {navItems
          .filter((item) => item.section === "הגדרות")
          .map((item) => (
            <button
              key={item.id}
              className={`${styles.navBtn} ${
                activeView === item.id ? styles.active : ""
              }`}
              onClick={() => onChangeView(item.id)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
      </nav>

      <div className={styles.sbFooter}>
        <button className={styles.navBtn} onClick={onToggleTheme}>
          <span className={styles.icon}>{theme === "dark" ? "🌙" : "☀️"}</span>
          <span>{theme === "dark" ? "מצב כהה/בהיר" : "מצב בהיר/כהה"}</span>
        </button>

        <button className={styles.navBtn} onClick={onGoHome}>
          <span className={styles.icon}>🏠</span>
          <span>דף הבית</span>
        </button>

        <button
          className={styles.navBtn}
          onClick={onLogout}
          style={{ color: "var(--red)" }}
        >
          <span className={styles.icon}>🚪</span>
          <span>התנתק</span>
        </button>
      </div>
    </aside>
  );
}