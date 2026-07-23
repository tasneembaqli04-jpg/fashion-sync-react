import { useEffect, useMemo, useState } from "react";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function ReturnRequestModal({
  open,
  order,
  returnRequests = [],
  onClose,
  onSubmit,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.returns;

  const REASONS = [
    { key: "defective", label: t.reasonDefective },
    { key: "wrongSize", label: t.reasonWrongSize },
    { key: "notAsDescribed", label: t.reasonNotAsDescribed },
    { key: "changedMind", label: t.reasonChangedMind },
    { key: "other", label: t.reasonOther },
  ];

  const availableItems = useMemo(() => {
    if (!order) return [];
    return order.items.filter(
      (item) =>
        !returnRequests.some(
          (r) => r.orderId === order.id && r.itemCode === item.code
        )
    );
  }, [order, returnRequests]);

  const [selectedItemCode, setSelectedItemCode] = useState("");
  const [reasonKey, setReasonKey] = useState(REASONS[0].key);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedItemCode(availableItems[0]?.code || "");
      setReasonKey(REASONS[0].key);
      setNote("");
      setSubmitting(false);
      setSubmitError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order]);

  if (!open || !order) return null;

  const selectedItem = availableItems.find(
    (item) => item.code === selectedItemCode
  );

  async function handleSubmit() {
    if (!selectedItem) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const selectedReason = REASONS.find((r) => r.key === reasonKey);
      await onSubmit({
        item: selectedItem,
        reasonKey,
        reason: selectedReason?.label || reasonKey,
        note,
      });
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
      <div className={modalStyles.modalBox} style={{ width: "460px" }}>
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

        {availableItems.length === 0 ? (
          <div style={{ color: "var(--muted)", padding: "1rem 0" }}>
            {t.noItemsAvailable}
          </div>
        ) : (
          <>
            <div className={modalStyles.pdField} style={{ marginBottom: "0.85rem" }}>
              <label>{t.selectItemLabel}</label>
              <select
                value={selectedItemCode}
                onChange={(e) => setSelectedItemCode(e.target.value)}
              >
                {availableItems.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name} ×{item.qty}
                  </option>
                ))}
              </select>
            </div>

            {selectedItem?.img && (
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
                <img
                  src={selectedItem.img}
                  alt={selectedItem.name}
                  style={{
                    width: "48px",
                    height: "48px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
                <div style={{ fontWeight: 700 }}>{selectedItem.name}</div>
              </div>
            )}

            <div className={modalStyles.pdField} style={{ marginBottom: "0.85rem" }}>
              <label>{t.reasonLabel}</label>
              <select value={reasonKey} onChange={(e) => setReasonKey(e.target.value)}>
                {REASONS.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
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
              disabled={submitting || !selectedItem}
            >
              {t.submitButton}
            </button>
          </>
        )}
      </div>
    </div>
  );
}