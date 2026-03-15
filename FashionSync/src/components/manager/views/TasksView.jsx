import styles from "../../../styles/Manager.module.scss";

export default function TasksView() {
  return (
    <div className={styles.view}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>📋 משימות לעובדים</h2>
          <p>הוסף משימות שיופיעו אוטומטית בפורטל העובד</p>
        </div>
        <span className={`${styles.tag} ${styles.tBlue}`}>0 משימות</span>
      </div>

      <div className={styles.mgrTaskForm}>
        <div className={styles.mgrTaskFormTitle}>➕ הוסף משימה חדשה</div>

        <div className={styles.mtfGrid}>
          <div className={styles.mtfField} style={{ gridColumn: "span 2" }}>
            <div className={styles.mtfLabel}>כותרת המשימה</div>
            <input
              className={styles.mtfInput}
              type="text"
              placeholder="לדוגמה: עדכון מלאי — חולצות חדשות"
            />
          </div>

          <div className={styles.mtfField} style={{ gridColumn: "span 2" }}>
            <div className={styles.mtfLabel}>תיאור / הנחיות</div>
            <input
              className={styles.mtfInput}
              type="text"
              placeholder="הוראות מפורטות לעובד..."
            />
          </div>

          <div className={styles.mtfField}>
            <div className={styles.mtfLabel}>דחיפות</div>
            <select className={styles.mtfInput}>
              <option value="high">🔴 דחוף</option>
              <option value="med">🟠 בינוני</option>
              <option value="low">🟢 רגיל</option>
            </select>
          </div>

          <div className={styles.mtfField}>
            <div className={styles.mtfLabel}>עובד מיועד</div>
            <select className={styles.mtfInput}>
              <option value="כולם">👥 כל העובדים</option>
              <option value="דנה לוי">דנה לוי</option>
              <option value="רון מזרחי">רון מזרחי</option>
            </select>
          </div>

          <div className={styles.mtfField}>
            <div className={styles.mtfLabel}>קישור לקטגוריה</div>
            <select className={styles.mtfInput}>
              <option value="">ללא קישור</option>
              <option value="inventory">📦 ניהול מלאי</option>
              <option value="addprod">➕ קבלת סחורה</option>
              <option value="sell">🏷️ סריקת מכירה</option>
              <option value="catalog">📋 קטלוג</option>
            </select>
          </div>

          <div className={styles.mtfField}>
            <div className={styles.mtfLabel}>אייקון</div>
            <select className={styles.mtfInput}>
              <option value="📦">📦 מלאי</option>
              <option value="🏷️">🏷️ מכירה</option>
              <option value="📸">📸 צילום</option>
              <option value="🧹">🧹 סידור</option>
              <option value="🔖">🔖 תיוג מחירים</option>
              <option value="📋">📋 כללי</option>
              <option value="⚠️">⚠️ דחוף</option>
              <option value="🚚">🚚 משלוח</option>
              <option value="🔍">🔍 בדיקה</option>
            </select>
          </div>
        </div>

        <div className={`${styles.alert} ${styles.aDanger}`} style={{ display: "none", marginBottom: "0.55rem" }}>
          ❌ יש למלא לפחות כותרת
        </div>

        <button className={styles.btnGold} style={{ padding: "0.62rem 1.3rem" }}>
          📤 שלח משימה לעובד
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>📋 משימות שנשלחו</div>
          <button
            className={styles.btnGhost}
            style={{ fontSize: "0.7rem", padding: "0.28rem 0.65rem", color: "var(--red)" }}
          >
            🗑 נקה הכל
          </button>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.mgrTasksEmpty}>
            <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📭</div>
            <div style={{ fontSize: ".84rem" }}>לא נשלחו משימות עדיין</div>
          </div>
        </div>
      </div>
    </div>
  );
}