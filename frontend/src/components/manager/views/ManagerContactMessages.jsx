import { useEffect, useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import {
  getAllContactMessages,
  markContactMessageRead,
  saveContactReply,
} from "../../../services/contact/contactMessagesService";
import { sendContactReplyEmail } from "../../../services/email/emailService";
import { useLanguage } from "../../../translations/LanguageProvider";
import MonthFilter from "../../common/MonthFilter";
import {
  getMonthKey,
  matchesMonthFilter,
} from "../../../functions/shared/monthFilter";
import { formatDateTime } from "../../../functions/shared/dateFormat";

export default function ManagerContactMessages() {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.contactMessages;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unread");
  const [monthFilter, setMonthFilter] = useState(() => getMonthKey(new Date()));

  // Drafts are held per enquiry, so switching between them while composing
  // does not carry one reply into another's box.
  const [replyDrafts, setReplyDrafts] = useState({});
  const [sendingReplyId, setSendingReplyId] = useState("");
  const [replyError, setReplyError] = useState("");

  useEffect(() => {
    getAllContactMessages().then((data) => {
      setMessages(data);
      setLoading(false);
    });
  }, []);

  async function markRead(id) {
    await markContactMessageRead(id, true);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: true } : m))
    );
  }

  /**
   * Sends the manager's reply and records it on the enquiry.
   *
   * The email goes first and the record is written only if it succeeded. The
   * other way round, a failed send would leave a reply on screen that the
   * customer never received, and the manager would have no reason to try
   * again.
   */
  async function sendReply(message) {
    const text = (replyDrafts[message.id] || "").trim();
    if (!text || sendingReplyId) return;

    setSendingReplyId(message.id);
    setReplyError("");

    try {
      await sendContactReplyEmail({
        toEmail: message.email,
        name: message.name,
        originalMessage: message.message,
        replyText: text,
      });

      await saveContactReply(message.id, text);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? { ...m, replyText: text, repliedAt: new Date().toISOString(), read: true }
            : m
        )
      );

      setReplyDrafts((prev) => ({ ...prev, [message.id]: "" }));
    } catch (err) {
      console.warn(`Reply not sent: ${err.message}`);
      setReplyError(message.id);
    } finally {
      setSendingReplyId("");
    }
  }

  const visibleMessages = useMemo(() => {
    return messages.filter((m) => {
      if (filter === "unread" && m.read) return false;
      if (filter === "read" && !m.read) return false;
      if (!matchesMonthFilter(monthFilter, m.createdAt)) return false;
      return true;
    });
  }, [messages, filter, monthFilter]);

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

        {/* Enquiries are filed by createdAt, the only date they carry. */}
        <MonthFilter
          records={messages}
          getDate={(m) => m.createdAt}
          value={monthFilter}
          onChange={setMonthFilter}
        />
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
                <strong>{(lang === "en" && msg.nameEn) ? msg.nameEn : (msg.name || t.anonymous)}</strong>
                {msg.email && (
                  <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {" "}
                    · {msg.email}
                  </span>
                )}
                <div style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                  🕒 {formatDateTime(msg.createdAt, lang)}
                </div>
              </div>

              {/*
                Only "mark as read". Answering marks it read on its own, and
                putting an enquiry back to unread claims something untrue —
                it has been read, whatever is still owed on it.
              */}
              {!msg.read && (
                <button
                  type="button"
                  className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
                  style={{ fontSize: "0.78rem", padding: "0.3rem 0.7rem" }}
                  onClick={() => markRead(msg.id)}
                >
                  {t.markAsRead}
                </button>
              )}
            </div>

            <div style={{ marginTop: "0.7rem", whiteSpace: "pre-wrap" }}>
              {(lang === "en" && msg.messageEn) ? msg.messageEn : msg.message}
            </div>

            {msg.replyText ? (
              <div
                style={{
                  marginTop: "0.9rem",
                  padding: "0.7rem 0.9rem",
                  borderRadius: "10px",
                  background: "rgba(201, 168, 76, 0.08)",
                  borderInlineStart: "3px solid var(--gold)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--muted)",
                    marginBottom: "0.3rem",
                  }}
                >
                  {t.repliedLabel} · {formatDateTime(msg.repliedAt, lang)}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.replyText}</div>
              </div>
            ) : (
              <div style={{ marginTop: "0.9rem" }}>
                {/*
                  An enquiry with no address cannot be answered from here. The
                  contact form is open to guests, and one who mistyped her
                  address leaves nothing to reply to.
                */}
                {msg.email ? (
                  <>
                    <label
                      htmlFor={`reply-${msg.id}`}
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        color: "var(--muted)",
                        marginBottom: "0.3rem",
                      }}
                    >
                      {t.replyLabel}
                    </label>
                    <textarea
                      id={`reply-${msg.id}`}
                      rows={3}
                      value={replyDrafts[msg.id] || ""}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [msg.id]: e.target.value,
                        }))
                      }
                      placeholder={t.replyPlaceholder}
                      style={{
                        width: "100%",
                        resize: "vertical",
                        fontFamily: "Alef, sans-serif",
                        fontSize: "0.9rem",
                        padding: "0.6rem",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        background: "var(--surface2)",
                        color: "var(--text)",
                      }}
                    />

                    <button
                      type="button"
                      className={`${uiStyles.btn} ${uiStyles.btnGold}`}
                      style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}
                      onClick={() => sendReply(msg)}
                      disabled={
                        !(replyDrafts[msg.id] || "").trim() ||
                        sendingReplyId === msg.id
                      }
                    >
                      {sendingReplyId === msg.id
                        ? t.replySending
                        : t.replySendButton}
                    </button>

                    {replyError === msg.id && (
                      <div
                        style={{
                          marginTop: "0.4rem",
                          fontSize: "0.8rem",
                          color: "var(--red)",
                        }}
                      >
                        {t.replyFailed}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                    {t.replyNoAddress}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}