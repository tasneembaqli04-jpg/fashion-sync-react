import { useState } from "react";
import modalStyles from "../../styles/employee/EmployeeModals.module.scss";
import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";
import sellStyles from "../../styles/employee/EmployeeSell.module.scss";

export default function ScanModal({ isOpen, scanTarget, onClose, onApplyCode }) {
  const [manualCode, setManualCode] = useState("");

  if (!isOpen) return null;

  function handleApply() {
    if (!manualCode.trim()) return;
    onApplyCode(manualCode.trim(), scanTarget);
    setManualCode("");
  }

  return (
    <div className={`${modalStyles.modalWrap} ${modalStyles.open}`}>
      <div className={modalStyles.modalBox}>
        <h2>📷 סריקת ברקוד</h2>
        <p>כרגע מצב ידני בלבד ב-React</p>

        <div className={modalStyles.scanModeTabs}>
          <button className={`${modalStyles.scanMtab} ${modalStyles.active}`}>
            ⌨️ ידנית
          </button>
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
              className={sellStyles.barcodeInput}
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="לדוגמה: FS-001"
            />

            <button
              className={`${layoutStyles.btn} ${layoutStyles.btnGold}`}
              onClick={handleApply}
            >
              חפש
            </button>
          </div>
        </div>

        <button
          className={`${layoutStyles.btn} ${layoutStyles.btnOutline}`}
          style={{ width: "100%" }}
          onClick={onClose}
        >
          סגור ✕
        </button>
      </div>
    </div>
  );
}
