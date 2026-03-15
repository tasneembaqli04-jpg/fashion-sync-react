import styles from "../../styles/Home.module.scss";

export default function IntentModal({
  isOpen,
  onClose,
  onBrowse,
  onGoToLogin,
}) {
  if (!isOpen) return null;

  return (
    <div className={`${styles.fsModal} ${styles.show}`} onClick={onClose}>
      <div
        className={styles.fsModalCard}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.fsModalHeader}>
          <h3>ברוך הבא לחנות 👋</h3>
          <button className={styles.fsClose} onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </div>

        <p className={styles.fsModalIntro}>מה תרצה לעשות היום?</p>

        <div className={styles.fsChoices}>
          <button
            className={`${styles.fsChoiceBtn} ${styles.goldBorder}`}
            onClick={onGoToLogin}
            type="button"
          >
            <span className={styles.fci}>🔑</span>
            <div>
              <div className={styles.fcLabel}>כניסה עם מייל וסיסמה</div>
              <div className={styles.fcSub}>
                גישה מלאה לסל, מועדפים, הזמנות ועוד
              </div>
            </div>
          </button>

          <button className={styles.fsChoiceBtn} onClick={onBrowse} type="button">
            <span className={styles.fci}>👀</span>
            <div>
              <div className={styles.fcLabel}>רק להסתכל</div>
              <div className={styles.fcSub}>כניסה מהירה לקטלוג ללא כניסה</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
