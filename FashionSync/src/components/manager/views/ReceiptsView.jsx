import styles from "../../../styles/Manager.module.scss";

export default function ReceiptsView() {
  return (
    <div className={styles.view}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>קבלות מכירה</h2>
          <p>חפש לפי קוד קבלה</p>
        </div>
      </div>

      <div className={styles.card} style={{ maxWidth: "720px", marginBottom: "1.2rem" }}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>🔍 חיפוש לפי קוד קבלה</div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.searchRow}>
            <input className={styles.si} type="text" placeholder="קוד קבלה" />
            <button className={styles.btnGold}>חפש</button>
          </div>

          <div>
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.6rem" }}>🧾</div>
              הכנס קוד קבלה לחיפוש
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>📋 כל הקבלות האחרונות</div>
        </div>
        <div className={styles.cardBody}></div>
      </div>
    </div>
  );
}