import styles from "../../styles/employee/EmployeeModals.module.scss";

export default function NotificationBar({ notification, onClose }) {
  if (!notification) return null;

  return (
    <div
      className={`${styles.notifBar} ${styles.show} ${
        notification.type ? styles[notification.type] : styles.info
      }`}
    >
      <span className={styles.notifBarIcon}>
        {notification.icon || "ℹ️"}
      </span>

      <span className={styles.notifBarText}>
        {notification.text}
      </span>

      <button
        className={styles.notifBarClose}
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}