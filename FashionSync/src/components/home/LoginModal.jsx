import styles from "../../styles/Home.module.scss";

export default function LoginModal({
  isOpen,
  email,
  password,
  error,
  onEmailChange,
  onPasswordChange,
  onClose,
  onBack,
  onSubmit,
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
          <h3>כניסה לחנות 🔑</h3>
          <button className={styles.fsClose} onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </div>

        <div className={styles.fsHint}>
          <strong>כניסה מותרת רק עם Gmail</strong> — בפעם הראשונה זה "רישום", ובפעמים
          הבאות חייבים אותה סיסמה 😊
        </div>

        <div className={styles.fsField}>
          <label>כתובת אימייל</label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="mail@gmail.com"
          />
        </div>

        <div className={styles.fsField}>
          <label>סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="סיסמה (לפחות 8 תווים)"
          />
        </div>

        {error ? <div className={styles.fsErrVisible}>{error}</div> : null}

        <div className={styles.fsActions}>
          <button className={`${styles.fsBtn} ${styles.fsBtnPrimary}`} onClick={onSubmit}>
            כניסה
          </button>

          <button className={`${styles.fsBtn} ${styles.fsBtnGhost}`} onClick={onClose}>
            ביטול
          </button>
        </div>

        <div className={styles.fsBack} onClick={onBack}>
          ← חזרה לבחירה
        </div>
      </div>
    </div>
  );
}
