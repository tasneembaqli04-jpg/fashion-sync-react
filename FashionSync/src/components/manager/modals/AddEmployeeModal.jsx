import modalStyles from "../../../styles/manager/ManagerModals.module.scss";
import formStyles from "../../../styles/manager/ManagerForms.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import alertStyles from "../../../styles/manager/ManagerAlerts.module.scss";

export default function AddEmployeeModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className={modalStyles.modalOverlay}
      onClick={onClose}
    >
      <div
        className={modalStyles.modalBox}
        style={{ maxWidth: "400px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={modalStyles.modalClose}
          onClick={onClose}
        >
          ✕
        </button>

        <div className={modalStyles.modalTitle}>👤 הוסף עובד</div>

        <div className={formStyles.fg}>
          <div className={formStyles.fl}>שם מלא</div>
          <input className={formStyles.fi} placeholder="שם העובד" />
        </div>

        <div className={formStyles.fg}>
          <div className={formStyles.fl}>שם משתמש</div>
          <input className={formStyles.fi} placeholder="username" />
        </div>

        <div className={formStyles.fg}>
          <div className={formStyles.fl}>סיסמה</div>
          <input
            className={formStyles.fi}
            type="password"
            placeholder="סיסמה"
          />
        </div>

        <div className={formStyles.fg}>
          <div className={formStyles.fl}>תפקיד</div>
          <input
            className={formStyles.fi}
            placeholder="לדוגמה: מוכר/ת"
          />
        </div>

        <div
          className={`${alertStyles.alert} ${alertStyles.aDanger}`}
          style={{ display: "none", marginBottom: "0.55rem" }}
        >
          ❌ יש למלא את כל השדות
        </div>

        <button
          className={`${uiStyles.btn} ${uiStyles.btnGold}`}
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