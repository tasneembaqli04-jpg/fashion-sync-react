import { useMemo, useState } from "react";
import styles from "../../../styles/manager/ManagerUI.module.scss";
import { useLanguage } from "../../../translations/LanguageProvider";
import ReceiptDetailsModal from "../modals/ReceiptDetailsModal";
import MonthFilter from "../../common/MonthFilter";
import {
  getMonthKey,
  matchesMonthFilter,
} from "../../../functions/shared/monthFilter";
import { formatDateTime } from "../../../functions/shared/dateFormat";

function ReceiptBlock({ receipt, locale, lang, t, onOpenDetails }) {

  return (
    <div className={styles.receiptBlock}>
      <div className={styles.receiptHd}>
        <div>
          <div className={styles.receiptId}>{receipt.id}</div>
          <div className={styles.receiptDate}>{formatDateTime(receipt.date, lang)}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <div
            style={{
              color: "var(--gold)",
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.25rem",
              fontWeight: 700,
            }}
          >
            ₪{receipt.total.toLocaleString()}
          </div>

          <button
            type="button"
            onClick={() => onOpenDetails(receipt)}
            style={{
              background: "transparent",
              border: "1px solid var(--blue)",
              color: "var(--blue)",
              borderRadius: "8px",
              padding: "0.35rem 0.7rem",
              fontSize: "0.78rem",
              fontFamily: "Alef, sans-serif",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t.receiptDetailsButton}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptsView({ receipts }) {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.receipts;
  const locale = lang === "en" ? "en-US" : "he-IL";
  const [query, setQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState(() => getMonthKey(new Date()));
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => matchesMonthFilter(monthFilter, r.date));
  }, [receipts, monthFilter]);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    return receipts.filter((r) =>
      r.id.toUpperCase().includes(query.trim().toUpperCase())
    );
  }, [query, receipts]);

  return (
    <div className={`${styles.view} ${styles.active}`}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className={styles.card} style={{ maxWidth: 720, marginBottom: "1.3rem" }}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>{t.searchTitle}</div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.searchRow}>
            <input
              className={styles.si}
              type="text"
              placeholder={t.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <button className={`${styles.btn} ${styles.btnGold}`}>
              {t.searchButton}
            </button>
          </div>

          <div>
            {!query.trim() ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: ".6rem" }}>🧾</div>
                {t.enterCodeToSearch}
              </div>
            ) : matches.length === 0 ? (
              <div className={`${styles.alert} ${styles.aDanger}`}>
                {t.notFound} <strong>{query}</strong>
              </div>
            ) : (
              <>
                <div className={`${styles.alert} ${styles.aInfo}`}>
                  {t.foundReceipts.replace("{count}", matches.length)}
                </div>

                {matches
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((receipt) => (
                    <ReceiptBlock key={receipt.id} receipt={receipt} locale={locale} lang={lang} t={t} onOpenDetails={setSelectedReceipt} />
                  ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>{t.allRecentReceipts}</div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
              {t.filterByMonthLabel}
            </label>
            {/* Receipts are filed by date, the moment of sale. */}
            <MonthFilter
              records={receipts}
              getDate={(r) => r.date}
              value={monthFilter}
              onChange={setMonthFilter}
            />
          </div>
        </div>

        <div className={styles.cardBody}>
          {filteredReceipts
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((receipt) => (
              <ReceiptBlock key={receipt.id} receipt={receipt} locale={locale} lang={lang} t={t} onOpenDetails={setSelectedReceipt} />
            ))}
        </div>
      </div>

      <ReceiptDetailsModal
        open={Boolean(selectedReceipt)}
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}