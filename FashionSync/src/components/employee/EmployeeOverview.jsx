import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";
import overviewStyles from "../../styles/employee/EmployeeOverview.module.scss";
import taskStyles from "../../styles/employee/EmployeeTasks.module.scss";

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

  const lowItems = products
    .filter((p) => p.stock === 0 || p.stock <= 2)
    .slice(0, 4);

  const openTasks = tasks.slice(0, 4);
  const recentHistory = history.slice(0, 5);

  return (
    <div className={`${layoutStyles.panel} ${layoutStyles.active}`}>
      <div className={layoutStyles.pageHeader}>
        <div className={layoutStyles.pageTitle}>סקירה כללית</div>
        <div className={layoutStyles.pageSub}>
          ברוך הבא, {currentUser?.name}
        </div>
      </div>

      <div className={layoutStyles.statsRow}>
        <div className={`${overviewStyles.statCard} ${overviewStyles.blue}`}>
          <div className={overviewStyles.statIcon}>📦</div>
          <div className={overviewStyles.statLabel}>פריטים</div>
          <div className={`${overviewStyles.statValue} ${overviewStyles.blueText}`}>
            {total}
          </div>
          <div className={overviewStyles.statSub}>סה"כ מוצרים</div>
        </div>

        <div className={`${overviewStyles.statCard} ${overviewStyles.green}`}>
          <div className={overviewStyles.statIcon}>✅</div>
          <div className={overviewStyles.statLabel}>זמינים</div>
          <div className={`${overviewStyles.statValue} ${overviewStyles.greenText}`}>
            {inStock}
          </div>
          <div className={overviewStyles.statSub}>במלאי</div>
        </div>

        <div className={`${overviewStyles.statCard} ${overviewStyles.orange}`}>
          <div className={overviewStyles.statIcon}>⚠️</div>
          <div className={overviewStyles.statLabel}>מלאי נמוך</div>
          <div className={`${overviewStyles.statValue} ${overviewStyles.orangeText}`}>
            {low}
          </div>
          <div className={overviewStyles.statSub}>פחות מ-3</div>
        </div>

        <div className={`${overviewStyles.statCard} ${overviewStyles.red}`}>
          <div className={overviewStyles.statIcon}>🚨</div>
          <div className={overviewStyles.statLabel}>אזל</div>
          <div className={`${overviewStyles.statValue} ${overviewStyles.redText}`}>
            {out}
          </div>
        </div>
      </div>

      <div className={layoutStyles.twoCol}>
        <div className={layoutStyles.card}>
          <div className={layoutStyles.secTitle}>✅ המשימות שלי</div>

          <div className={taskStyles.taskList}>
            {openTasks.length === 0 ? (
              <div className={taskStyles.tasksEmptyState}>אין משימות כרגע</div>
            ) : (
              openTasks.map((task) => (
                <div className={taskStyles.task} key={task.id}>
                  <div className={taskStyles.taskIcon}>{task.icon || "📌"}</div>
                  <div className={taskStyles.taskInfo}>
                    <div className={taskStyles.taskTitle}>{task.title}</div>
                    {task.desc && (
                      <div className={taskStyles.taskSub}>{task.desc}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={layoutStyles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.85rem",
            }}
          >
            <div
              className={layoutStyles.secTitle}
              style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}
            >
              🚨 התראות מלאי
            </div>

            <button
              className={layoutStyles.tblBtn}
              onClick={() => onShowPanel("inventory")}
            >
              צפה הכל
            </button>
          </div>

          <table className={layoutStyles.tbl}>
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
                  <td
                    colSpan="3"
                    style={{ textAlign: "center", color: "var(--text-dim)" }}
                  >
                    ✅ כל המוצרים במלאי תקין
                  </td>
                </tr>
              ) : (
                lowItems.map((p) => (
                  <tr key={p.code}>
                    <td>
                      <div className={layoutStyles.pc}>
                        <img
                          className={layoutStyles.pimg}
                          src={p.img}
                          alt={p.name}
                        />
                        <div>
                          <div className={layoutStyles.pname}>{p.name}</div>
                          <div className={layoutStyles.psku}>{p.code}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.stock}</td>
                    <td>
                      {p.stock === 0 ? (
                        <span className={`${layoutStyles.tag} ${layoutStyles.tagRed}`}>
                          אזל
                        </span>
                      ) : (
                        <span className={`${layoutStyles.tag} ${layoutStyles.tagOrange}`}>
                          נמוך
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={layoutStyles.card} style={{ marginTop: "1.2rem" }}>
        <div className={layoutStyles.secTitle}>⚡ פעילות אחרונה</div>
        <div className={overviewStyles.feed}>
          {recentHistory.length === 0 ? (
            <div className={overviewStyles.feedItem}>
              <div className={overviewStyles.feedText}>אין פעילות עדיין</div>
            </div>
          ) : (
            recentHistory.map((item, index) => (
              <div className={overviewStyles.feedItem} key={item.id || index}>
                <div className={overviewStyles.feedText}>{item.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
