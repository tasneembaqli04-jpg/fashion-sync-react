import { useNavigate } from "react-router-dom";
import styles from "../../styles/employee/EmployeeSidebar.module.scss";

export default function EmployeeSidebar({
  currentUser,
  activePanel,
  isSidebarOpen,
  onShowPanel,
  onToggleTheme,
  onLogout,
  onCloseSidebar,
  tasksCount,
  ordersCount,
}) {
  const navigate = useNavigate();

  return (
    <>
      <div
        className={`${styles.sidebarOverlay} ${isSidebarOpen ? styles.open : ""}`}
        onClick={onCloseSidebar}
      ></div>

      <aside
        className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}
      >
        <div className={styles.brand}>
          Fashion
          <br />
          Sync
        </div>

        <div className={styles.roleBadge}>פורטל עובד</div>

        <div className={styles.empChip}>
          <span>👤</span>
          <span className={styles.empChipName}>{currentUser?.name || "—"}</span>
        </div>

        <div className={styles.navSection}>ראשי</div>
        <button
          className={`${styles.navItem} ${activePanel === "overview" ? styles.active : ""}`}
          onClick={() => onShowPanel("overview")}
        >
          <span className={styles.navIcon}>🏠</span>
          סקירה כללית
        </button>

        <button
          className={`${styles.navItem} ${activePanel === "tasks" ? styles.active : ""}`}
          onClick={() => onShowPanel("tasks")}
        >
          <span className={styles.navIcon}>✅</span>
          משימות
          {tasksCount > 0 && (
            <span className={styles.navBadge}>{tasksCount}</span>
          )}
        </button>

        <div className={styles.navSection}>מכירות</div>
        <button
          className={`${styles.navItem} ${activePanel === "sell" ? styles.active : ""}`}
          onClick={() => onShowPanel("sell")}
        >
          <span className={styles.navIcon}>🏷️</span>
          סריקת מכירה
        </button>

        <div className={styles.navSection}>מלאי</div>
        <button
          className={`${styles.navItem} ${activePanel === "inventory" ? styles.active : ""}`}
          onClick={() => onShowPanel("inventory")}
        >
          <span className={styles.navIcon}>📦</span>
          ניהול מלאי
        </button>

        <div className={styles.navSection}>הזמנות</div>
        <button
          className={`${styles.navItem} ${activePanel === "orders" ? styles.active : ""}`}
          onClick={() => onShowPanel("orders")}
        >
          <span className={styles.navIcon}>📋</span>
          הזמנות לקוחות
          {ordersCount > 0 && (
            <span className={styles.navBadge}>{ordersCount}</span>
          )}
        </button>

        <div className={styles.navSection}>היסטוריה</div>
        <button
          className={`${styles.navItem} ${activePanel === "history" ? styles.active : ""}`}
          onClick={() => onShowPanel("history")}
        >
          <span className={styles.navIcon}>🕒</span>
          פעילות אחרונה
        </button>

        <div className={styles.sidebarFooter}>
          <button className={styles.navItem} onClick={onToggleTheme}>
            <span className={styles.navIcon}>🌓</span>
            מצב כהה/בהיר
          </button>

          <button className={styles.navItem} onClick={() => navigate("/")}>
            <span className={styles.navIcon}>🏡</span>
            דף הבית
          </button>

          <button
            className={styles.navItem}
            onClick={onLogout}
            style={{ color: "var(--red)" }}
          >
            <span className={styles.navIcon}>🚪</span>
            התנתקות
          </button>
        </div>
      </aside>
    </>
  );
}
