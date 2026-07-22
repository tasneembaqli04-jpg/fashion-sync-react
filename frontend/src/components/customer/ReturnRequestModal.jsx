import { useEffect, useState } from "react";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function ReturnRequestModal({ open, item, onClose, onSubmit }) {
  const { t: dict } = useLanguage();
  const t = dict.customer.returns;

  const REASONS = [
    t.reasonDefective,
    t.reasonWrongSize,
    t.reasonNotAsDescribed,
    t.reasonChangedMind,
    t.reasonOther,
  ];

  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) {
      setReason(REASONS[0]);
      setNote("");
      setSubmitting(false);
      setSubmitError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  if (!open || !item) return null;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");

    try {
      await onSubmit({ reason, note });
      setNote("");
    } catch (err) {
      console.error("Return request submit failed:", err);
      setSubmitError(dict.common.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`${modalStyles.modalWrap} ${modalStyles.open}`}>
      <div className={modalStyles.modalBox} style={{ width: "440px" }}>
        <button className={modalStyles.modalClose} onClick={onClose}>
          ✕
        </button>

        <div
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: "1.25rem",
            color: "var(--gold)",
            marginBottom: "0.8rem",
          }}
        >
          {t.modalTitle}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.7rem",
            marginBottom: "1rem",
            paddingBottom: "0.9rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {item.img && (
            <img
              src={item.img}
              alt={item.name}
              style={{
                width: "48px",
                height: "48px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          )}
          <div style={{ fontWeight: 700 }}>{item.name}</div>
        </div>

        <div className={modalStyles.pdField} style={{ marginBottom: "0.85rem" }}>
          <label>{t.reasonLabel}</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className={modalStyles.pdField} style={{ marginBottom: "1rem" }}>
          <label>{t.noteLabel}</label>
          <input
            type="text"
            placeholder={t.notePlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {submitError && (
          <div style={{ color: "#ff6b6b", fontSize: "0.85rem", marginBottom: "0.7rem" }}>
            {submitError}
          </div>
        )}

        <button
          className={`${baseStyles.btn} ${baseStyles.btnGold}`}
          style={{ width: "100%" }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {t.submitButton}
        </button>
      </div>
    </div>
  );
}