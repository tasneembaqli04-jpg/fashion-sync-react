import { useEffect, useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import { useLanguage } from "../../../translations/LanguageProvider";
import { getAllGiftCards, translateGiftCard } from "../../../services/giftcard/giftCardService";
import MonthFilter from "../../common/MonthFilter";
import { matchesAnySearchField } from "../../../functions/shared/textSearch";
import {
  getMonthKey,
  matchesMonthFilter,
} from "../../../functions/shared/monthFilter";
import { formatDate } from "../../../functions/shared/dateFormat";

export default function GiftCardOrdersView() {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.giftCardOrders;

  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [monthFilter, setMonthFilter] = useState(getMonthKey(new Date()));
  const [amountFilter, setAmountFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  function loadCards() {
    return getAllGiftCards().then((cards) => {
      setGiftCards(cards);
      setLoading(false);
      return cards;
    });
  }

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    if (loading) return;

    const cardsNeedingTranslation = giftCards.filter(
      (card) =>
        (card.recipientName && (!card.recipientNameEn || card.recipientNameEn.trim() === card.recipientName.trim())) ||
        (card.message && (!card.messageEn || card.messageEn.trim() === card.message.trim())),
    );

    if (cardsNeedingTranslation.length === 0) return;

    setTranslating(true);

    Promise.all(cardsNeedingTranslation.map((card) => translateGiftCard(card))).then(() => {
      loadCards().then(() => setTranslating(false));
    });
  }, [loading]);

  const entries = useMemo(() => {
    return giftCards.map((card) => ({
      code: card.code || "",
      // Shown in the language on screen.
      recipient: (lang === "en" && card.recipientNameEn) || card.recipientName || "",
      // Both spellings, kept for the search. An English recipient name is a
      // transliteration, so the same person is "רותם" and "Rotem", and the
      // manager will type whichever she remembers.
      recipientName: card.recipientName || "",
      recipientNameEn: card.recipientNameEn || "",
      message: (lang === "en" && card.messageEn) || card.message || "",
      amount: Number(card.amount) || 0,
      balance: Number(card.balance) || 0,
      status: card.status || "active",
      buyerEmail: card.buyerEmail || "",
      date: card.createdAt || null,
    }));
  }, [giftCards, lang]);

  const monthFilteredEntries = useMemo(() => {
    return entries.filter((e) => matchesMonthFilter(monthFilter, e.date));
  }, [entries, monthFilter]);

  const totalSold = entries.length;
  const totalValue = entries.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthKey = getMonthKey(new Date());
  const thisMonthCount = entries.filter(
    (e) => getMonthKey(e.date) === thisMonthKey,
  ).length;

  const visibleEntries = monthFilteredEntries.filter((entry) => {
    if (amountFilter === "under100" && entry.amount >= 100) return false;
    if (amountFilter === "100to300" && (entry.amount < 100 || entry.amount > 300)) return false;
    if (amountFilter === "over300" && entry.amount <= 300) return false;

    if (
      !matchesAnySearchField(
        searchTerm,
        entry.code,
        entry.recipientName,
        entry.recipientNameEn,
      )
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className={layoutStyles.view}>
      <div className={uiStyles.pageHd}>
        <div className={uiStyles.phLeft}>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div
        className={overviewStyles.statsGrid}
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        <div className={`${overviewStyles.stat} ${overviewStyles.gold}`}>
          <div className={overviewStyles.statIcon}>🎁</div>
          <div className={overviewStyles.statLabel}>{t.totalSold}</div>
          <div className={overviewStyles.statVal}>{totalSold}</div>
          <div className={overviewStyles.statSub}>{t.cardsSuffix}</div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.green}`}>
          <div className={overviewStyles.statIcon}>💰</div>
          <div
            className={overviewStyles.statLabel}
            style={{ color: "var(--green)" }}
          >
            {t.totalValue}
          </div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--green)" }}
          >
            ₪{totalValue.toLocaleString()}
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.blue}`}>
          <div className={overviewStyles.statIcon}>📅</div>
          <div
            className={overviewStyles.statLabel}
            style={{ color: "var(--blue)" }}
          >
            {t.thisMonth}
          </div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--blue)" }}
          >
            {thisMonthCount}
          </div>
          <div className={overviewStyles.statSub}>{t.cardsSuffix2}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: "1 1 320px",
            maxWidth: "400px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontSize: "0.95rem",
          }}
        />

        <select
          value={amountFilter}
          onChange={(e) => setAmountFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontSize: "0.95rem",
          }}
        >
          <option value="all">{t.allAmounts}</option>
          <option value="under100">{t.amountUnder100}</option>
          <option value="100to300">{t.amount100to300}</option>
          <option value="over300">{t.amountOver300}</option>
        </select>

        {/*
          Gift cards are filed by the date the card was issued. The "this
          month" figure above is counted separately and always means the
          current month, whatever is selected here.
        */}
        <MonthFilter
          records={entries}
          getDate={(e) => e.date}
          value={monthFilter}
          onChange={setMonthFilter}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", opacity: 0.7 }}>
          {dict.common.loading}
        </div>
      ) : (
        <>
          {translating && (
            <div
              style={{
                textAlign: "center",
                padding: "0.6rem",
                marginBottom: "0.8rem",
                borderRadius: "10px",
                background: "rgba(201,168,76,0.08)",
                border: "1px solid var(--gold)",
                color: "var(--gold)",
                fontSize: "0.85rem",
              }}
            >
              🌍 {lang === "en" ? "Translating older gift cards…" : "מתרגם כרטיסי מתנה ישנים…"}
            </div>
          )}

          {!visibleEntries.length ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", opacity: 0.7 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎁</div>
          <div>{t.noCards}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {visibleEntries.map((entry, index) => (
            <div
              key={`${entry.code}-${index}`}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "1rem 1.2rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      letterSpacing: "1px",
                      fontWeight: 700,
                      color: "var(--gold)",
                      fontSize: "1rem",
                    }}
                  >
                    {entry.code}
                  </span>
                  <span
                    className={uiStyles.tag}
                    style={{
                      background: "rgba(46,204,113,0.1)",
                      border: "1px solid var(--green)",
                      color: "var(--green)",
                    }}
                  >
                    ₪{entry.amount.toLocaleString()}
                  </span>
                  <span
                    className={uiStyles.tag}
                    style={
                      entry.status === "active"
                        ? { background: "rgba(46,204,113,0.1)", border: "1px solid var(--green)", color: "var(--green)" }
                        : entry.status === "pending"
                          ? { background: "rgba(230,126,34,0.1)", border: "1px solid #e67e22", color: "#e67e22" }
                          : entry.status === "rejected"
                            ? { background: "rgba(231,76,60,0.1)", border: "1px solid var(--red)", color: "var(--red)" }
                            : { background: "rgba(150,150,150,0.1)", border: "1px solid var(--muted)", color: "var(--muted)" }
                    }
                  >
                    {entry.status === "active"
                      ? t.statusActive
                      : entry.status === "pending"
                        ? t.statusPending
                        : entry.status === "rejected"
                          ? t.statusRejected
                          : t.statusUsed}
                  </span>
                </div>

                <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                  {t.recipientLabel}: <strong>{entry.recipient || "—"}</strong>
                </div>

                {entry.message && (
                  <div style={{ fontSize: "0.82rem", opacity: 0.65, fontStyle: "italic" }}>
                    {t.messageLabel}: "{entry.message}"
                  </div>
                )}

                <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                  {t.buyerLabel}: {entry.buyerEmail || "—"}
                </div>

                <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                  {t.balanceLabel}: ₪{entry.balance.toLocaleString()}
                </div>
              </div>

              <div style={{ fontSize: "0.82rem", opacity: 0.7, whiteSpace: "nowrap" }}>
                🕒 {formatDate(entry.date, lang)}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}