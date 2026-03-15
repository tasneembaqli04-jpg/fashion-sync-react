import styles from "../../../styles/Manager.module.scss";

export default function AddEmployeeModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={`${styles.modalOv} ${styles.open}`} onClick={onClose}>
      <div className={styles.modalBox} style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          ✕
        </button>

        <div className={styles.modalTitle}>👤 הוסף עובד</div>

        <div className={styles.fg}>
          <div className={styles.fl}>שם מלא</div>
          <input className={styles.fi} placeholder="שם העובד" />
        </div>

        <div className={styles.fg}>
          <div className={styles.fl}>שם משתמש</div>
          <input className={styles.fi} placeholder="username" />
        </div>

        <div className={styles.fg}>
          <div className={styles.fl}>סיסמה</div>
          <input className={styles.fi} type="password" placeholder="סיסמה" />
        </div>

        <div className={styles.fg}>
          <div className={styles.fl}>תפקיד</div>
          <input className={styles.fi} placeholder="לדוגמה: מוכר/ת" />
        </div>

        <div className={`${styles.alert} ${styles.aDanger}`} style={{ display: "none", marginBottom: "0.55rem" }}>
          ❌ יש למלא את כל השדות
        </div>

        <button
          className={styles.btnGold}
          style={{
            width: "100%",
            marginTop: "0.3rem",
            padding: "0.8rem",
            justifyContent: "center",
          }}
        >
          הוסף עובד
        </button>
      </div>
    </div>
  );
}