export default function NotificationBar({ notification, onClose }) {
  if (!notification) return null;

  return (
    <div className={`notif-bar show ${notification.type || "info"}`}>
      <span className="notif-bar-icon">{notification.icon || "ℹ️"}</span>
      <span className="notif-bar-text">{notification.text}</span>
      <button className="notif-bar-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}
