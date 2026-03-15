import styles from "../../../styles/Manager.module.scss";

export default function AnalyticsView() {
  return (
    <div className={styles.view}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>אנליטיקה</h2>
          <p>סטטיסטיקות מכירות והוצאות</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.stat} ${styles.gold}`}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statLabel}>הכנסות החודש</div>
          <div className={styles.statVal} style={{ color: "var(--gold)" }}>₪38,420</div>
          <div className={`${styles.statSub} ${styles.up}`}>↑ 12.4%</div>
        </div>

        <div className={`${styles.stat} ${styles.red}`}>
          <div className={styles.statIcon}>📉</div>
          <div className={styles.statLabel}>הוצאות החודש</div>
          <div className={styles.statVal} style={{ color: "var(--red)" }}>₪22,150</div>
          <div className={`${styles.statSub} ${styles.dn}`}>↑ 4.1% מהחודש קודם</div>
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
      </div>

      <div className={styles.card} style={{ marginBottom: "1.1rem" }}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>💼 סיכום כספי — החודש</div>
        </div>

        <div className={styles.cardBody}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                padding: "0.85rem",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "11px",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "0.3rem",
                }}
              >
                הכנסות
              </div>
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "1.5rem",
                  color: "var(--green)",
                  fontWeight: 700,
                }}
              >
                ₪38,420
              </div>
            </div>

            <div
              style={{
                padding: "0.85rem",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "11px",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "0.3rem",
                }}
              >
                הוצאות
              </div>
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "1.5rem",
                  color: "var(--red)",
                  fontWeight: 700,
                }}
              >
                ₪22,150
              </div>
            </div>

            <div
              style={{
                padding: "0.85rem",
                background: "rgba(201, 168, 76, 0.06)",
                border: "1px solid var(--border-gold)",
                borderRadius: "11px",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "0.3rem",
                }}
              >
                רווח נקי
              </div>
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "1.5rem",
                  color: "var(--gold)",
                  fontWeight: 700,
                }}
              >
                ₪16,270
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.g2}>
        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>מכירות לפי קטגוריה</div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.barChart}></div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>הוצאות לפי קטגוריה</div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.barChart}></div>
          </div>
        </div>
      </div>
    </div>
  );
}