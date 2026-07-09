import modalStyles from "../../../styles/manager/ManagerModals.module.scss";
import formStyles from "../../../styles/manager/ManagerForms.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";

export default function EditProductModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div
        className={modalStyles.modalBox}
        style={{ maxWidth: "420px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={modalStyles.modalClose} onClick={onClose}>
          ✕
        </button>

        <div className={modalStyles.modalTitle}>עריכת מוצר</div>

        <div className={formStyles.fg}>
          <div className={formStyles.fl}>מחיר (₪)</div>
          <input className={formStyles.fi} type="number" min="0" />
        </div>

        <div className={formStyles.fg}>
          <div className={formStyles.fl}>מינימום להתראה</div>
          <input className={formStyles.fi} type="number" min="0" />
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.6rem",
            marginTop: "1rem",
          }}
        >
          <button className={`${uiStyles.btn} ${uiStyles.btnGold}`}>
            שמירה
          </button>

          <button
            className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
            onClick={onClose}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}