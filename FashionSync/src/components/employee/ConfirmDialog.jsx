import styles from "../../styles/employee/EmployeeModals.module.scss";
import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";

export default function ConfirmDialog({ confirmData, onCancel, onConfirm }) {
  if (!confirmData) return null;

  return (
    <>
      <div
        className={`${styles.confirmDialogBackdrop} ${styles.open}`}
        onClick={onCancel}
      ></div>

      <div className={`${styles.confirmDialog} ${styles.open}`}>
        <div className={styles.confirmDialogIcon}>
          {confirmData.icon || "🗑"}
        </div>

        <div className={styles.confirmDialogTitle}>
          {confirmData.title}
        </div>

        <div className={styles.confirmDialogSub}>
          {confirmData.sub}
        </div>

        <div className={styles.confirmDialogBtns}>
          <button
            className={`${layoutStyles.btn} ${layoutStyles.btnOutline}`}
            onClick={onCancel}
          >
            ביטול
          </button>

          <button
            className={`${layoutStyles.btn} ${layoutStyles.btnDanger}`}
            onClick={onConfirm}
          >
            {confirmData.okLabel || "אישור"}
          </button>
        </div>
      </div>
    </>
  );
}
