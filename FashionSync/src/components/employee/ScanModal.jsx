import { useState } from "react";

export default function ScanModal({ isOpen, scanTarget, onClose, onApplyCode }) {
  const [manualCode, setManualCode] = useState("");

  if (!isOpen) return null;

  function handleApply() {
    if (!manualCode.trim()) return;
    onApplyCode(manualCode.trim(), scanTarget);
    setManualCode("");
  }

  return (
    <div className="modal-wrap open">
      <div className="modal-box">
        <h2>📷 סריקת ברקוד</h2>
        <p>כרגע מצב ידני בלבד ב-React</p>

        <div className="scan-mode-tabs">
          <button className="scan-mtab active">⌨️ ידנית</button>
        </div>

        <div style={{ marginBottom: "0.85rem" }}>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-dim)",
              marginBottom: "0.55rem",
              textAlign: "right",
            }}
          >
            הכנס קוד מוצר ידנית:
          </div>

          <div style={{ display: "flex", gap: "0.55rem" }}>
            <input
              className="barcode-input"
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="לדוגמה: FS-001"
            />
            <button className="btn btn-gold" onClick={handleApply}>
              חפש
            </button>
          </div>
        </div>

        <button className="btn btn-outline" style={{ width: "100%" }} onClick={onClose}>
          סגור ✕
        </button>
      </div>
    </div>
  );
}
