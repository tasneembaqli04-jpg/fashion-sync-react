import { useEffect, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import {
  getAllStockNotifications,
  markStockNotificationDone,
  deleteStockNotification,
} from "../../../../backend/services/notifications/notificationsService";

function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StockNotificationsView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllStockNotifications().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  async function handleMarkDone(id) {
    await markStockNotificationDone(id);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notified: true } : item))
    );
  }

  async function handleDelete(id) {
    if (!window.confirm("למחוק את הבקשה?")) return;
    await deleteStockNotification(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  const pendingCount = items.filter((item) => !item.notified).length;

  return (
    <div className={layoutStyles.view}>
      <div className={uiStyles.pageHd}>
        <div className={uiStyles.phLeft}>
          <h2>בקשות "הודע לי כשחוזר למלאי"</h2>
          <p>
            {pendingCount} בקשות ממתינות מתוך {items.length} סה"כ
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.3rem" }}>
            💡 סימון ידני כאן הוא רק לניהול פנימי — הלקוחה תראה "חזר למלאי" רק
            אם למוצר יש בפועל מלאי גדול מ-0.
          </p>
        </div>
      </div>

      {loading ? (
        <div>טוען...</div>
      ) : !items.length ? (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
          עדיין אין בקשות
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-gold)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "12px",
              color: "var(--text)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.7rem",
            }}
          >
            <div>
              <strong>{item.productName || item.productCode}</strong>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                {item.email && <span>✉️ {item.email} · </span>}
                {item.phone && <span>📞 {item.phone}</span>}
              </div>
              <div style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                🕒 {fmtDate(item.createdAt)}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              {!item.notified ? (
                <button
                  type="button"
                  className={`${uiStyles.btn} ${uiStyles.btnGold}`}
                  onClick={() => handleMarkDone(item.id)}
                >
                  ✓ סומן כהודע
                </button>
              ) : (
                <span className={`${uiStyles.tag} ${uiStyles.tGreen}`}>✓ הודע</span>
              )}

              <button
                type="button"
                className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
                onClick={() => handleDelete(item.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}