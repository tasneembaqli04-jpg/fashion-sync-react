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
  return (
    <>
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={onCloseSidebar}
      ></div>

      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="brand">
          Fashion
          <br />
          Sync
        </div>
        <div className="role-badge">פורטל עובד</div>

        <div className="emp-chip">
          <span>👤</span>
          <span className="emp-chip-name">{currentUser?.name || "—"}</span>
        </div>

        <div className="nav-section">ראשי</div>
        <button
          className={`nav-item ${activePanel === "overview" ? "active" : ""}`}
          onClick={() => onShowPanel("overview")}
        >
          <span className="nav-icon">🏠</span> סקירה כללית
        </button>

        <button
          className={`nav-item ${activePanel === "tasks" ? "active" : ""}`}
          onClick={() => onShowPanel("tasks")}
        >
          <span className="nav-icon">✅</span> משימות
          {tasksCount > 0 && <span className="nav-badge">{tasksCount}</span>}
        </button>

        <div className="nav-section">מכירות</div>
        <button
          className={`nav-item ${activePanel === "sell" ? "active" : ""}`}
          onClick={() => onShowPanel("sell")}
        >
          <span className="nav-icon">🏷️</span> סריקת מכירה
        </button>

        <div className="nav-section">מלאי</div>
        <button
          className={`nav-item ${activePanel === "inventory" ? "active" : ""}`}
          onClick={() => onShowPanel("inventory")}
        >
          <span className="nav-icon">📦</span> ניהול מלאי
        </button>

        <div className="nav-section">הזמנות</div>
        <button
          className={`nav-item ${activePanel === "orders" ? "active" : ""}`}
          onClick={() => onShowPanel("orders")}
        >
          <span className="nav-icon">📋</span> הזמנות לקוחות
          {ordersCount > 0 && <span className="nav-badge">{ordersCount}</span>}
        </button>

        <div className="nav-section">היסטוריה</div>
        <button
          className={`nav-item ${activePanel === "history" ? "active" : ""}`}
          onClick={() => onShowPanel("history")}
        >
          <span className="nav-icon">🕒</span> פעילות אחרונה
        </button>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={onToggleTheme}>
            <span className="nav-icon">🌓</span> מצב כהה/בהיר
          </button>

          <button className="nav-item" onClick={onLogout} style={{ color: "var(--red)" }}>
            <span className="nav-icon">🚪</span> התנתקות
          </button>
        </div>
      </aside>
    </>
  );
}
