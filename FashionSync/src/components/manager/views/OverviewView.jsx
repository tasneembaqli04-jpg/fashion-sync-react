import styles from "../../../styles/Manager.module.scss";

export default function OverviewView() {
  return (
    <div className={`${styles.view} ${styles.activeView}`}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>שלום 👋</h2>
          <p>{new Date().toLocaleDateString("he-IL")}</p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className={`${styles.tag} ${styles.tGreen}`}>● מחובר</span>
          <span className={`${styles.tag} ${styles.tGold}`}>FashionSync</span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.stat} ${styles.gold}`}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statLabel}>פריטים במלאי</div>
          <div className={styles.statVal} style={{ color: "var(--gold)" }}>
            —
          </div>
          <div className={styles.statSub}></div>
        </div>

        <div className={`${styles.stat} ${styles.green}`}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statLabel}>מכירות</div>
          <div className={styles.statVal} style={{ color: "var(--green)" }}>
            —
          </div>
          <div className={`${styles.statSub} ${styles.up}`}></div>
        </div>

        <div className={`${styles.stat} ${styles.red}`}>
          <div className={styles.statIcon}>⚠️</div>
          <div className={styles.statLabel}>בעיות מלאי</div>
          <div className={styles.statVal} style={{ color: "var(--red)" }}>
            —
          </div>
          <div className={`${styles.statSub} ${styles.dn}`}>דורש טיפול</div>
        </div>

        <div className={`${styles.stat} ${styles.blue}`}>
          <div className={styles.statIcon}>🔥</div>
          <div className={styles.statLabel}>ביקושים גבוהים</div>
          <div className={styles.statVal} style={{ color: "var(--blue)" }}>
            —
          </div>
          <div className={styles.statSub}>notifyCount &gt; 15</div>
        </div>
      </div>

      <div className={styles.g2}>
        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>🔔 התראות פעילות</div>
            <button className={styles.btnGhost} style={{ fontSize: "0.7rem", padding: "0.28rem 0.65rem" }}>
              הכל ←
            </button>
          </div>
          <div className={styles.cardBody}></div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>📊 מכירות שבועיות</div>
            <span className={`${styles.tag} ${styles.tGold}`}>₪ לפי יום</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.miniBars}></div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "0.3rem",
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>
            📦 מוצרים שלא נמכרים — מועמדים לפרסום
          </div>
          <span className={`${styles.tag} ${styles.tOrange}`} style={{ fontSize: "0.63rem" }}>
            0–2 מכירות בחודש
          </span>
        </div>
        <div className={styles.cardBody}></div>
      </div>
    </div>
  );
}