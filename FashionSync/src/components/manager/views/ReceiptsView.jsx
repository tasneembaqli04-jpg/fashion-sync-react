import { useMemo, useState } from "react";
import styles from "../../../styles/Manager.module.scss";

function fmtDate(date) {
  return new Date(date).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReceiptBlock({ receipt }) {
  return (
    <div className={styles.receiptBlock}>
      <div className={styles.receiptHd}>
        <div>
          <div className={styles.receiptId}>{receipt.id}</div>
          <div className={styles.receiptDate}>{fmtDate(receipt.date)}</div>
        </div>

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
      </div>

      {receipt.items.map((item, index) => (
        <div key={`${receipt.id}-${index}`} className={styles.receiptItem}>
          <img
            src={item.img}
            alt={item.name}
            style={{
              width: 42,
              height: 42,
              objectFit: "cover",
              borderRadius: 7,
              border: "1px solid var(--border)",
            }}
          />

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: ".88rem" }}>{item.name}</div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: ".72rem",
                color: "var(--muted)",
              }}
            >
              {item.code}
            </div>
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={{ color: "var(--gold)" }}>
              ₪{item.price} × {item.qty}
            </div>
            <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>
              = ₪{item.price * item.qty}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReceiptsView({ receipts }) {
  const [query, setQuery] = useState("");

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
          <h2>קבלות מכירה</h2>
          <p>חפש לפי קוד קבלה</p>
        </div>
      </div>

      <div className={styles.card} style={{ maxWidth: 720, marginBottom: "1.3rem" }}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>🔍 חיפוש לפי קוד קבלה</div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.searchRow}>
            <input
              className={styles.si}
              type="text"
              placeholder="קוד קבלה"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <button className={`${styles.btn} ${styles.btnGold}`}>
              חפש
            </button>
          </div>

          <div>
            {!query.trim() ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: ".6rem" }}>🧾</div>
                הכנס קוד קבלה לחיפוש
              </div>
            ) : matches.length === 0 ? (
              <div className={`${styles.alert} ${styles.aDanger}`}>
                ❌ לא נמצאה קבלה: <strong>{query}</strong>
              </div>
            ) : (
              <>
                <div className={`${styles.alert} ${styles.aInfo}`}>
                  ✅ נמצאו {matches.length} קבלות
                </div>

                {matches
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((receipt) => (
                    <ReceiptBlock key={receipt.id} receipt={receipt} />
                  ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>📋 כל הקבלות האחרונות</div>
        </div>

        <div className={styles.cardBody}>
          {receipts
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((receipt) => (
              <ReceiptBlock key={receipt.id} receipt={receipt} />
            ))}
        </div>
      </div>
    </div>
  );
}
