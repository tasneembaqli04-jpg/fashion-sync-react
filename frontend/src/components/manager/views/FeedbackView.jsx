import { useEffect, useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import {
  getAllFeedback,
  updateFeedbackReadStatus,
} from "../../../services/feedback/feedbackService";
import { useLanguage } from "../../../translations/LanguageProvider";
import MonthFilter from "../../common/MonthFilter";
import {
  getMonthKey,
  matchesMonthFilter,
} from "../../../functions/shared/monthFilter";
import { formatDateTime } from "../../../functions/shared/dateFormat";

export default function FeedbackView() {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.feedback;
  // Feedback used to be tagged with a topic. The customer form no longer asks
  // for one, so nothing new arrives tagged, but entries from when it did are
  // still shown and still need their labels.
  const TOPIC_LABELS_BY_ID = {
    design: t.topicDesign,
    search: t.topicSearch,
    shopping: t.topicShopping,
    mobile: t.topicMobile,
    chatbot: t.topicChatbot,
    suggestion: t.topicSuggestion,
  };

  const LEGACY_TOPIC_LABELS = {
    "🎨 עיצוב": "design",
    "🔍 חיפוש": "search",
    "🛒 קנייה": "shopping",
    "📱 מובייל": "mobile",
    "💬 צ'אטבוט": "chatbot",
    "💡 הצעה": "suggestion",
    "🎨 Design": "design",
    "🔍 Search": "search",
    "🛒 Shopping": "shopping",
    "📱 Mobile": "mobile",
    "💬 Chatbot": "chatbot",
    "💡 Suggestion": "suggestion",
  };

  function translateTopic(rawTopic) {
    const cleaned = String(rawTopic || "").trim();

    if (TOPIC_LABELS_BY_ID[cleaned]) {
      return TOPIC_LABELS_BY_ID[cleaned];
    }

    if (LEGACY_TOPIC_LABELS[cleaned]) {
      return TOPIC_LABELS_BY_ID[LEGACY_TOPIC_LABELS[cleaned]] || cleaned;
    }

    const partialMatchKey = Object.keys(LEGACY_TOPIC_LABELS).find(
      (key) => cleaned.includes(key) || key.includes(cleaned),
    );

    if (partialMatchKey) {
      return TOPIC_LABELS_BY_ID[LEGACY_TOPIC_LABELS[partialMatchKey]] || cleaned;
    }

    return cleaned;
  }

  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState("unread");
  const [monthFilter, setMonthFilter] = useState(() => getMonthKey(new Date()));

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

  const visibleFeedback = useMemo(() => {
    return feedback.filter((item) => {
      if (readFilter === "unread" && item.read) return false;
      if (readFilter === "read" && !item.read) return false;
      if (!matchesMonthFilter(monthFilter, item.createdAt)) return false;
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

        {/* Feedback is filed by createdAt, which is the only date it carries. */}
        <MonthFilter
          records={feedback}
          getDate={(item) => item.createdAt}
          value={monthFilter}
          onChange={setMonthFilter}
        />
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <strong>{item.user}</strong>
                {!item.read && (
                  <span className={`${uiStyles.tag} ${uiStyles.tGold}`}>
                    {t.unreadBadge}
                  </span>
                )}
              </div>
              <span style={{ color: "var(--muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                {formatDateTime(item.createdAt, lang)}
              </span>
            </div>

            <div style={{ margin: "6px 0", color: "var(--gold)" }}>
              {"⭐".repeat(item.rating || 0)}
              {!item.rating && <span style={{ color: "var(--muted)" }}>{t.noRating}</span>}
            </div>

            {!!item.topics?.length && (
              <div style={{ marginBottom: "6px", color: "var(--muted)" }}>
                {(Array.isArray(item.topics)
                  ? item.topics
                  : String(item.topics).split(" · ")
                )
                  .map(translateTopic)
                  .join(" · ")}
              </div>
            )}

            {item.text && (
              <div style={{ marginBottom: "10px" }}>
                {(lang === "en" && item.textEn) ? item.textEn : item.text}
              </div>
            )}

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