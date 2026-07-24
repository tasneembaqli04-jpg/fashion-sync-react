import { useEffect, useState } from "react";
import styles from "../../styles/Home.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";
import {
  verifyCode,
  resendVerificationCode,
} from "../../services/verification/verificationService";

export default function EmailVerificationModal({
  isOpen,
  email,
  name,
  onClose,
  onVerified,
}) {
  const { t: dict } = useLanguage();
  const t = dict.home.verification;

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setError("");
      setVerifying(false);
      setResendCooldown(30);
      setResendMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  async function handleVerify() {
    setError("");
    setVerifying(true);

    try {
      const result = await verifyCode(email, code);

      if (!result.ok) {
        setError(
          result.reason === "expired"
            ? t.errorExpired
            : result.reason === "notFound"
            ? t.errorNotFound
            : t.errorMismatch
        );
        return;
      }

      onVerified();
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;

    await resendVerificationCode(email, name);
    setResendCooldown(30);
    setResendMessage(t.resendSuccess);
    setTimeout(() => setResendMessage(""), 3000);
  }

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
          <button className={styles.fsClose} onClick={onClose} aria-label="close">
            ✕
          </button>
        </div>

        <div className={styles.fsHint}>
          {t.subtitle.replace("{email}", email)}
        </div>

        <div className={styles.fsField}>
          <label>{t.codeLabel}</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder={t.codePlaceholder}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
        </div>

        {error ? <div className={styles.fsErrVisible}>{error}</div> : null}

        <div className={styles.fsActions}>
          <button
            className={`${styles.fsBtn} ${styles.fsBtnPrimary}`}
            onClick={handleVerify}
            disabled={verifying || code.length !== 6}
          >
            {verifying ? t.verifying : t.verifyButton}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "0.9rem" }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={{
              background: "none",
              border: "none",
              color: resendCooldown > 0 ? "var(--light-gray)" : "var(--gold)",
              fontSize: "0.82rem",
              cursor: resendCooldown > 0 ? "default" : "pointer",
              textDecoration: resendCooldown > 0 ? "none" : "underline",
            }}
          >
            {resendCooldown > 0
              ? t.resendCooldown.replace("{seconds}", resendCooldown)
              : t.resendButton}
          </button>

          {resendMessage && (
            <div style={{ fontSize: "0.8rem", color: "var(--green)", marginTop: "0.3rem" }}>
              {resendMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}