import { useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import { useLanguage } from "../../../translations/LanguageProvider";

function getMonthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function GiftCardOrdersView({ orders = [] }) {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.giftCardOrders;
  const MONTH_NAMES = dict.monthNames;
  const locale = lang === "en" ? "en-US" : "he-IL";

  const [monthFilter, setMonthFilter] = useState(getMonthKey(new Date()));
  const [amountFilter, setAmountFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  function fmtDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  function getMonthLabel(monthKey) {
    if (monthKey === "unknown") return "";
    const [year, month] = monthKey.split("-");
    return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
  }

  const giftCardEntries = useMemo(() => {
    const entries = [];

    orders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];

      items
        .filter((item) => item.isGiftCard)
        .forEach((item) => {
          entries.push({
            code: item.code || item.key || "",
            recipient: item.giftRecipient || "",
            message: item.giftMessage || "",
            amount: Number(item.price) || 0,
            buyerName:
              order.customerEmbedded?.name ||
              order.customerDetails?.name ||
              order.customerEmail ||
              "",
            date: order.date || order.createdAt || null,
          });
        });
    });

    return entries;
  }, [orders]);

  const availableMonths = useMemo(() => {
    const keys = new Set(giftCardEntries.map((e) => getMonthKey(e.date)));
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
  }, [giftCardEntries]);

  const monthFilteredEntries = useMemo(() => {
    if (monthFilter === "all") return giftCardEntries;
    return giftCardEntries.filter((e) => getMonthKey(e.date) === monthFilter);
  }, [giftCardEntries, monthFilter]);

  const totalSold = giftCardEntries.length;
  const totalValue = giftCardEntries.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthKey = getMonthKey(new Date());
  const thisMonthCount = giftCardEntries.filter(
    (e) => getMonthKey(e.date) === thisMonthKey,
  ).length;

  const visibleEntries = monthFilteredEntries.filter((entry) => {
    if (amountFilter === "under100" && entry.amount >= 100) return false;
    if (amountFilter === "100to300" && (entry.amount < 100 || entry.amount > 300)) return false;
    if (amountFilter === "over300" && entry.amount <= 300) return false;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      const matchesCode = entry.code.toLowerCase().includes(term);
      const matchesRecipient = entry.recipient.toLowerCase().includes(term);
      if (!matchesCode && !matchesRecipient) return false;
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

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontSize: "0.95rem",
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
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
                  {t.buyerLabel}: {entry.buyerName || "—"}
                </div>
              </div>

              <div style={{ fontSize: "0.82rem", opacity: 0.7, whiteSpace: "nowrap" }}>
                🕒 {fmtDate(entry.date)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}