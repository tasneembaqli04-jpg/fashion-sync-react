import styles from "../../../styles/Manager.module.scss";

export default function AnalyticsView() {
  return (
    <div className={`${styles.view} ${styles.active}`}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>אנליטיקה</h2>
          <p>סטטיסטיקות מכירות</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.stat} ${styles.gold}`}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statLabel}>הכנסות החודש</div>
          <div className={styles.statVal} style={{ color: "var(--gold)" }}>₪38,420</div>
          <div className={`${styles.statSub} ${styles.up}`}>↑ 12.4%</div>
        </div>

        <div className={`${styles.stat} ${styles.green}`}>
          <div className={styles.statIcon}>🛍️</div>
          <div className={styles.statLabel}>מכירות</div>
          <div className={styles.statVal} style={{ color: "var(--green)" }}>143</div>
          <div className={`${styles.statSub} ${styles.up}`}>↑ 8.2%</div>
        </div>

        <div className={`${styles.stat} ${styles.blue}`}>
          <div className={styles.statIcon}>🔄</div>
          <div className={styles.statLabel}>ממוצע עסקה</div>
          <div className={styles.statVal} style={{ color: "var(--blue)" }}>₪269</div>
          <div className={`${styles.statSub} ${styles.up}`}>↑ 3.8%</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statIcon} style={{ color: "var(--purple)" }}>👥</div>
          <div className={styles.statLabel}>לקוחות חוזרים</div>
          <div className={styles.statVal} style={{ color: "var(--purple)" }}>68%</div>
          <div className={`${styles.statSub} ${styles.up}`}>↑ 5%</div>
        </div>
      </div>

      <div className={styles.g2}>
        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>מכירות לפי קטגוריה</div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.barChart}>
              <div className={styles.barRow}>
                <div className={styles.barLbl}>שמלות</div>
                <div className={styles.barTrk}>
                  <div className={styles.barFill} style={{ width: "82%", background: "var(--gold)" }} />
                </div>
                <div className={styles.barVal}>₪12,400</div>
              </div>

              <div className={styles.barRow}>
                <div className={styles.barLbl}>מכנסיים</div>
                <div className={styles.barTrk}>
                  <div className={styles.barFill} style={{ width: "64%", background: "var(--blue)" }} />
                </div>
                <div className={styles.barVal}>₪9,680</div>
              </div>

              <div className={styles.barRow}>
                <div className={styles.barLbl}>חולצות</div>
                <div className={styles.barTrk}>
                  <div className={styles.barFill} style={{ width: "48%", background: "var(--green)" }} />
                </div>
                <div className={styles.barVal}>₪7,260</div>
              </div>

              <div className={styles.barRow}>
                <div className={styles.barLbl}>עליוניות</div>
                <div className={styles.barTrk}>
                  <div className={styles.barFill} style={{ width: "35%", background: "var(--purple)" }} />
                </div>
                <div className={styles.barVal}>₪5,290</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
