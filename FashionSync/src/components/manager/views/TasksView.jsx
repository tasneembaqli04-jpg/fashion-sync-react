import { useState } from "react";
import styles from "../../../styles/Manager.module.scss";

export default function TasksView({ tasks, onAddTask, onDeleteTask, onClearTasks }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [urg, setUrg] = useState("med");
  const [emp, setEmp] = useState("כולם");
  const [link, setLink] = useState("");
  const [icon, setIcon] = useState("📦");
  const [showError, setShowError] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) {
      setShowError(true);
      setTimeout(() => setShowError(false), 2500);
      return;
    }

    onAddTask({
      title: title.trim(),
      desc: desc.trim(),
      urg,
      emp,
      link,
      icon,
      createdAt: new Date().toISOString(),
      done: false,
    });

    setTitle("");
    setDesc("");
    setUrg("med");
    setEmp("כולם");
    setLink("");
    setIcon("📦");
  };

  const urgLabels = { high: "דחוף", med: "בינוני", low: "רגיל" };
  const urgClass = {
    high: styles.ubHigh,
    med: styles.ubMed,
    low: styles.ubLow,
  };
  const cardClass = {
    high: styles.urgHigh,
    med: styles.urgMed,
    low: styles.urgLow,
  };

  return (
    <div className={`${styles.view} ${styles.active}`}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>📋 משימות לעובדים</h2>
          <p>הוסף משימות שיופיעו אוטומטית בפורטל העובד</p>
        </div>

        <span className={`${styles.tag} ${styles.tBlue}`}>{tasks.length} משימות</span>
      </div>

      <div className={styles.mgrTaskForm}>
        <div className={styles.mgrTaskFormTitle}>➕ הוסף משימה חדשה</div>

        <div className={styles.mtfGrid}>
          <div className={styles.mtfField} style={{ gridColumn: "span 2" }}>
            <div className={styles.mtfLabel}>כותרת המשימה</div>
            <input
              className={styles.mtfInput}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: עדכון מלאי — חולצות חדשות"
            />
          </div>

          <div className={styles.mtfField} style={{ gridColumn: "span 2" }}>
            <div className={styles.mtfLabel}>תיאור / הנחיות</div>
            <input
              className={styles.mtfInput}
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="הוראות מפורטות לעובד..."
            />
          </div>

          <div className={styles.mtfField}>
            <div className={styles.mtfLabel}>דחיפות</div>
            <select className={styles.mtfInput} value={urg} onChange={(e) => setUrg(e.target.value)}>
              <option value="high">🔴 דחוף</option>
              <option value="med">🟠 בינוני</option>
              <option value="low">🟢 רגיל</option>
            </select>
          </div>

          <div className={styles.mtfField}>
            <div className={styles.mtfLabel}>עובד מיועד</div>
            <select className={styles.mtfInput} value={emp} onChange={(e) => setEmp(e.target.value)}>
              <option value="כולם">👥 כל העובדים</option>
              <option value="דנה לוי">דנה לוי</option>
              <option value="רון מזרחי">רון מזרחי</option>
            </select>
          </div>

          <div className={styles.mtfField}>
            <div className={styles.mtfLabel}>קישור לקטגוריה (אופציונלי)</div>
            <select className={styles.mtfInput} value={link} onChange={(e) => setLink(e.target.value)}>
              <option value="">ללא קישור</option>
              <option value="inventory">📦 ניהול מלאי</option>
              <option value="addprod">➕ קבלת סחורה</option>
              <option value="sell">🏷️ סריקת מכירה</option>
              <option value="catalog">📋 קטלוג</option>
            </select>
          </div>

          <div className={styles.mtfField}>
            <div className={styles.mtfLabel}>אייקון</div>
            <select className={styles.mtfInput} value={icon} onChange={(e) => setIcon(e.target.value)}>
              <option value="📦">📦 מלאי</option>
              <option value="🏷️">🏷️ מכירה</option>
              <option value="📸">📸 צילום</option>
              <option value="🧹">🧹 ניקוי / סידור</option>
              <option value="🔖">🔖 תיוג מחירים</option>
              <option value="📋">📋 כללי</option>
              <option value="⚠️">⚠️ דחוף</option>
              <option value="🚚">🚚 משלוח</option>
              <option value="🔍">🔍 בדיקה</option>
            </select>
          </div>
        </div>

        {showError && (
          <div className={`${styles.alert} ${styles.aDanger}`} style={{ marginBottom: ".6rem" }}>
            ❌ יש למלא לפחות כותרת
          </div>
        )}

        <button
          className={`${styles.btn} ${styles.btnGold}`}
          style={{ padding: ".65rem 1.4rem" }}
          onClick={handleSubmit}
        >
          📤 שלח משימה לעובד
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>📋 משימות שנשלחו</div>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            style={{ fontSize: ".72rem", padding: ".3rem .7rem", color: "var(--red)" }}
            onClick={onClearTasks}
          >
            🗑 נקה הכל
          </button>
        </div>

        <div className={styles.cardBody}>
          {tasks.length === 0 ? (
            <div className={styles.mgrTasksEmpty}>
              <div className={styles.mgrTasksEmptyIcon}>📭</div>
              <div style={{ fontSize: ".86rem" }}>לא נשלחו משימות עדיין</div>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`${styles.mgrTaskCard} ${cardClass[task.urg]}`}
              >
                <div className={styles.mgrTaskIcon}>{task.icon}</div>

                <div className={styles.mgrTaskInfo}>
                  <div className={styles.mgrTaskTitleTxt}>{task.title}</div>

                  {task.desc && (
                    <div className={styles.mgrTaskDescTxt}>{task.desc}</div>
                  )}

                  <div className={styles.mgrTaskMeta}>
                    <span className={`${styles.mgrTaskUrgBadge} ${urgClass[task.urg]}`}>
                      {urgLabels[task.urg]}
                    </span>

                    <span className={styles.mgrTaskEmpBadge}>👤 {task.emp}</span>

                    {task.link && (
                      <span
                        style={{
                          fontSize: ".66rem",
                          background: "rgba(201,168,76,.1)",
                          color: "var(--gold)",
                          padding: ".1rem .5rem",
                          borderRadius: "20px",
                        }}
                      >
                        🔗 {task.link}
                      </span>
                    )}

                    <span className={styles.mgrTaskDateTxt}>
                      {new Date(task.createdAt).toLocaleString("he-IL", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <button
                  className={styles.mgrTaskDel}
                  title="מחק"
                  onClick={() => onDeleteTask(task.id)}
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
