import { useEffect, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import { getAllFeedback } from "../../../services/feedback/feedbackService";

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

export default function FeedbackView() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllFeedback().then((items) => {
      setFeedback(items);
      setLoading(false);
    });
  }, []);

  return (
    <div className={layoutStyles.view}>
      <div className={uiStyles.pageHd}>
        <div className={uiStyles.phLeft}>
          <h2>משוב לקוחות</h2>
          <p>מה לקוחות כתבו לפני התשלום</p>
        </div>
      </div>

      {loading ? (
        <div>טוען...</div>
      ) : !feedback.length ? (
        <div style={{ textAlign: "center", opacity: 0.7, padding: "2rem" }}>
          עדיין אין משובים
        </div>
      ) : (
        feedback.map((item) => (
          <div
            key={item.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-gold)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "12px",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{item.user}</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                {fmtDate(item.createdAt)}
              </span>
            </div>

            <div style={{ margin: "6px 0", color: "var(--gold)" }}>
              {"⭐".repeat(item.rating || 0)}
              {!item.rating && <span style={{ color: "var(--muted)" }}>ללא דירוג</span>}
            </div>

            {!!item.topics?.length && (
              <div style={{ marginBottom: "6px", color: "var(--muted)" }}>
                {item.topics.join(" · ")}
              </div>
            )}

            {item.text && <div>{item.text}</div>}
          </div>
        ))
      )}
    </div>
  );
}