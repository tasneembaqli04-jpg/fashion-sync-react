import { useEffect, useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import {
  getAllFeedback,
  updateFeedbackReadStatus,
} from "../../../services/feedback/feedbackService";
import { useLanguage } from "../../../translations/LanguageProvider";

function getMonthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FeedbackView() {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.feedback;
  const locale = lang === "en" ? "en-US" : "he-IL";
  const MONTH_NAMES = dict.monthNames;

  function fmtDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getMonthLabel(monthKey) {
    if (monthKey === "unknown") return dict.customer.orders.noDate;
    const [year, month] = monthKey.split("-");
    return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
  }

  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  useEffect(() => {
    getAllFeedback().then((items) => {
      setFeedback(items);
      setLoading(false);
    });
  }, []);

  async function toggleRead(item) {
    const nextRead = !item.read;
    await updateFeedbackReadStatus(item.id, nextRead);
    setFeedback((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, read: nextRead } : f))
    );
  }

  const availableMonths = useMemo(() => {
    const keys = new Set(feedback.map((f) => getMonthKey(f.createdAt)));
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
  }, [feedback]);

  const visibleFeedback = useMemo(() => {
    return feedback.filter((item) => {
      if (readFilter === "unread" && item.read) return false;
      if (readFilter === "read" && !item.read) return false;
      if (monthFilter !== "all" && getMonthKey(item.createdAt) !== monthFilter) {
        return false;
      }
      return true;
    });
  }, [feedback, readFilter, monthFilter]);

  return (
    <div className={layoutStyles.view}>
      <div className={uiStyles.pageHd}>
        <div className={uiStyles.phLeft}>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "1.2rem",
        }}
      >
        {[
          { key: "all", label: t.filterAll },
          { key: "unread", label: t.filterUnread },
          { key: "read", label: t.filterRead },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={uiStyles.filterTab}
            onClick={() => setReadFilter(tab.key)}
            style={
              readFilter === tab.key
                ? {
                    background: "var(--gold-dim)",
                    color: "var(--gold)",
                    borderColor: "var(--border-gold)",
                  }
                : {}
            }
          >
            {tab.label}
          </button>
        ))}

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontSize: "0.9rem",
          }}
        >
          <option value="all">{t.allMonths}</option>
          {availableMonths.map((key) => (
            <option key={key} value={key}>
              {getMonthLabel(key)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>{dict.common.loading}</div>
      ) : !visibleFeedback.length ? (
        <div style={{ textAlign: "center", opacity: 0.7, padding: "2rem" }}>
          {t.noFeedbackYet}
        </div>
      ) : (
        visibleFeedback.map((item) => (
          <div
            key={item.id}
            style={{
              background: "var(--surface)",
              border: item.read
                ? "1px solid var(--border-gold)"
                : "1px solid var(--gold)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "12px",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <strong>{item.user}</strong>
                {!item.read && (
                  <span className={`${uiStyles.tag} ${uiStyles.tGold}`}>
                    {t.unreadBadge}
                  </span>
                )}
              </div>
              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                {fmtDate(item.createdAt)}
              </span>
            </div>

            <div style={{ margin: "6px 0", color: "var(--gold)" }}>
              {"⭐".repeat(item.rating || 0)}
              {!item.rating && <span style={{ color: "var(--muted)" }}>{t.noRating}</span>}
            </div>

            {!!item.topics?.length && (
              <div style={{ marginBottom: "6px", color: "var(--muted)" }}>
                {item.topics.join(" · ")}
              </div>
            )}

            {item.text && <div style={{ marginBottom: "10px" }}>{item.text}</div>}

            {item.read ? (
              <span
                className={`${uiStyles.tag} ${uiStyles.tGreen}`}
                style={{ fontSize: "0.78rem", cursor: "default" }}
              >
                {t.alreadyRead}
              </span>
            ) : (
              <button
                type="button"
                className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
                style={{ fontSize: "0.78rem", padding: "0.3rem 0.7rem" }}
                onClick={() => toggleRead(item)}
              >
                {t.markAsRead}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}