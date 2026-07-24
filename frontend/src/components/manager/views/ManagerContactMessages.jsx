import { useEffect, useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import {
  getAllContactMessages,
  markContactMessageRead,
} from "../../../services/contact/contactMessagesService";
import { useLanguage } from "../../../translations/LanguageProvider";

export default function ManagerContactMessages() {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.contactMessages;
  const locale = lang === "en" ? "en-US" : "he-IL";

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getAllContactMessages().then((data) => {
      setMessages(data);
      setLoading(false);
    });
  }, []);

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

  async function toggleRead(id, currentRead) {
    await markContactMessageRead(id, !currentRead);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: !currentRead } : m))
    );
  }

  const visibleMessages = useMemo(() => {
    if (filter === "all") return messages;
    if (filter === "unread") return messages.filter((m) => !m.read);
    return messages.filter((m) => m.read);
  }, [messages, filter]);

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
            onClick={() => setFilter(tab.key)}
            style={
              filter === tab.key
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
      </div>

      {loading ? (
        <div>{dict.common.loading}</div>
      ) : !visibleMessages.length ? (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
          {t.noMessagesYet}
        </div>
      ) : (
        visibleMessages.map((msg) => (
          <div
            key={msg.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-gold)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "12px",
              color: "var(--text)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "0.8rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong>{msg.name || t.anonymous}</strong>
                {msg.email && (
                  <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {" "}
                    · {msg.email}
                  </span>
                )}
                <div style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                  🕒 {fmtDate(msg.createdAt)}
                </div>
              </div>

              <button
                type="button"
                className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
                style={{ fontSize: "0.78rem", padding: "0.3rem 0.7rem" }}
                onClick={() => toggleRead(msg.id, msg.read)}
              >
                {msg.read ? t.markAsUnread : t.markAsRead}
              </button>
            </div>

            <div style={{ marginTop: "0.7rem", whiteSpace: "pre-wrap" }}>
              {msg.message}
            </div>
          </div>
        ))
      )}
    </div>
  );
}