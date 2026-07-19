import styles from "../../styles/Home.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function LoginModal({
  isOpen,
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onClose,
  onSubmit,
}) {
  const { t: dict } = useLanguage();
  const t = dict.home.loginModal;

  if (!isOpen) return null;

  return (
    <div className={`${styles.fsModal} ${styles.show}`}>
      <div
        className={styles.fsModalCard}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.fsModalHeader}>
          <h3>{t.title}</h3>
          <button className={styles.fsClose} onClick={onClose} aria-label={t.close}>
            ✕
          </button>
        </div>

        <div className={styles.fsHint}>
          <strong>{t.hintBold}</strong>{t.hintRest}
        </div>

        <div className={styles.fsField}>
          <label>{t.emailLabel}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="mail@gmail.com"
          />
        </div>

        <div className={styles.fsField}>
          <label>{t.passwordLabel}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={t.passwordPlaceholder}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          />
        </div>

        {error ? <div className={styles.fsErrVisible}>{error}</div> : null}

        <div className={styles.fsActions}>
          <button
            className={`${styles.fsBtn} ${styles.fsBtnPrimary}`}
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? t.loggingIn : t.loginButton}
          </button>
          <button className={`${styles.fsBtn} ${styles.fsBtnGhost}`} onClick={onClose}>
            {dict.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}