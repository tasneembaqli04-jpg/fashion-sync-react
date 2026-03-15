export default function EmployeeOverview({
  currentUser,
  products,
  tasks,
  history,
  onShowPanel,
}) {
  const total = products.length;
  const inStock = products.filter((p) => p.stock > 0).length;
  const low = products.filter((p) => p.stock > 0 && p.stock <= 3).length;
  const out = products.filter((p) => p.stock === 0).length;

  const lowItems = products.filter((p) => p.stock === 0 || p.stock <= 2).slice(0, 4);
  const openTasks = tasks.slice(0, 4);
  const recentHistory = history.slice(0, 5);

  return (
    <div className="panel active">
      <div className="page-header">
        <div className="page-title">סקירה כללית</div>
        <div className="page-sub">ברוך הבא, {currentUser?.name}</div>
      </div>

      <div className="stats-row">
        <div className="stat-card blue">
          <div className="stat-icon">📦</div>
          <div className="stat-label">פריטים</div>
          <div className="stat-value blue">{total}</div>
          <div className="stat-sub">סה"כ מוצרים</div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-label">זמינים</div>
          <div className="stat-value green">{inStock}</div>
          <div className="stat-sub">במלאי</div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">⚠️</div>
          <div className="stat-label">מלאי נמוך</div>
          <div className="stat-value orange">{low}</div>
          <div className="stat-sub">פחות מ-3</div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon">🚨</div>
          <div className="stat-label">אזל</div>
          <div className="stat-value red">{out}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="sec-title">✅ המשימות שלי</div>

          <div className="task-list">
            {openTasks.length === 0 ? (
              <div className="tasks-empty-state">אין משימות כרגע</div>
            ) : (
              openTasks.map((task) => (
                <div className="task" key={task.id}>
                  <div className="task-icon">{task.icon || "📌"}</div>
                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    {task.desc && <div className="task-sub">{task.desc}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.85rem",
            }}
          >
            <div className="sec-title" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
              🚨 התראות מלאי
            </div>

            <button className="tbl-btn" onClick={() => onShowPanel("inventory")}>
              צפה הכל
            </button>
          </div>

          <table className="tbl">
            <thead>
              <tr>
                <th>פריט</th>
                <th>מלאי</th>
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {lowItems.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center", color: "var(--text-dim)" }}>
                    ✅ כל המוצרים במלאי תקין
                  </td>
                </tr>
              ) : (
                lowItems.map((p) => (
                  <tr key={p.code}>
                    <td>
                      <div className="pc">
                        <img className="pimg" src={p.img} alt={p.name} />
                        <div>
                          <div className="pname">{p.name}</div>
                          <div className="psku">{p.code}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.stock}</td>
                    <td>{p.stock === 0 ? "אזל" : "נמוך"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.2rem" }}>
        <div className="sec-title">⚡ פעילות אחרונה</div>
        <div className="feed">
          {recentHistory.length === 0 ? (
            <div className="feed-item">
              <div className="feed-text">אין פעילות עדיין</div>
            </div>
          ) : (
            recentHistory.map((item) => (
              <div className="feed-item" key={item.id}>
                <div className="feed-text">{item.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
