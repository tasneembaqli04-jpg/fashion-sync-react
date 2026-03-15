import styles from "../../../styles/Manager.module.scss";

function getAlertClass(type) {
  if (type === "danger") return `${styles.alert} ${styles.aDanger}`;
  if (type === "warn") return `${styles.alert} ${styles.aWarn}`;
  if (type === "info") return `${styles.alert} ${styles.aInfo}`;
  return `${styles.alert} ${styles.aSuccess}`;
}

function fmtDate(date) {
  return new Date(date).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OverviewView({ stats, alerts, products, receipts, onOpenAlerts }) {
  const today = new Date().toLocaleDateString("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const weekSales = [4200, 5800, 3900, 7200, 6100, 8450, 5300];
  const weekLabels = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
  const max = Math.max(...weekSales);

  const slowProducts = products.filter(
    (p) => p.stock > 0 && p.salesLastMonth <= 2
  );

  return (
    <div className={`${styles.view} ${styles.active}`}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>שלום 👋</h2>
          <p>{today}</p>
        </div>

        <div style={{ display: "flex", gap: ".5rem" }}>
          <span className={`${styles.tag} ${styles.tGreen}`}>● מחובר</span>
          <span className={`${styles.tag} ${styles.tGold}`}>FashionSync</span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.stat} ${styles.gold}`}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statLabel}>פריטים במלאי</div>
          <div className={styles.statVal} style={{ color: "var(--gold)" }}>
            {stats.totalStock}
          </div>
          <div className={`${styles.statSub} ${styles.up}`}>
            {stats.productCount} מוצרים
          </div>
        </div>

        <div className={`${styles.stat} ${styles.green}`}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statLabel}>מכירות</div>
          <div className={styles.statVal} style={{ color: "var(--green)" }}>
            ₪{stats.sales.toLocaleString()}
          </div>
          <div className={`${styles.statSub} ${styles.up}`}>
            {stats.receiptCount} עסקאות
          </div>
        </div>

        <div className={`${styles.stat} ${styles.red}`}>
          <div className={styles.statIcon}>⚠️</div>
          <div className={styles.statLabel}>בעיות מלאי</div>
          <div className={styles.statVal} style={{ color: "var(--red)" }}>
            {stats.lowCount}
          </div>
          <div className={`${styles.statSub} ${styles.dn}`}>דורש טיפול</div>
        </div>

        <div className={`${styles.stat} ${styles.blue}`}>
          <div className={styles.statIcon}>🔥</div>
          <div className={styles.statLabel}>ביקושים גבוהים</div>
          <div className={styles.statVal} style={{ color: "var(--blue)" }}>
            {stats.demandCount}
          </div>
          <div className={styles.statSub}>notifyCount &gt; 15</div>
        </div>
      </div>

      <div className={styles.g2}>
        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>🔔 התראות פעילות</div>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              style={{ fontSize: ".72rem", padding: ".3rem .7rem" }}
              onClick={onOpenAlerts}
            >
              הכל ←
            </button>
          </div>

          <div className={styles.cardBody}>
            {alerts.slice(0, 6).length > 0 ? (
              alerts.slice(0, 6).map((alert) => {
                const product = products.find((p) => p.code === alert.code);
                const img =
                  product?.img ||
                  "https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=400";

                return (
                  <div key={alert.key} className={getAlertClass(alert.type)}>
                    <img
                      src={img}
                      alt={alert.title}
                      style={{
                        width: 38,
                        height: 38,
                        objectFit: "cover",
                        borderRadius: 7,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <strong>{alert.title}</strong>
                      <div style={{ opacity: 0.9 }}>{alert.msg}</div>
                      <div style={{ opacity: 0.65, fontSize: ".78rem", marginTop: ".15rem" }}>
                        🕒 {fmtDate(alert.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`${styles.alert} ${styles.aSuccess}`}>
                ✅ אין התראות פעילות
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>📊 מכירות שבועיות</div>
            <span className={`${styles.tag} ${styles.tGold}`}>₪ לפי יום</span>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.miniBars}>
              {weekSales.map((value, index) => (
                <div
                  key={index}
                  className={`${styles.mbar} ${index === 5 ? styles.hi : ""}`}
                  style={{ height: `${Math.round((value / max) * 100)}%` }}
                  title={`₪${value.toLocaleString()}`}
                />
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: ".3rem",
              }}
            >
              {weekLabels.map((label) => (
                <span
                  key={label}
                  style={{ fontSize: ".62rem", color: "var(--muted)" }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>
            📦 מוצרים שלא נמכרים — מועמדים לפרסום
          </div>
          <span className={`${styles.tag} ${styles.tOrange}`} style={{ fontSize: ".65rem" }}>
            0–2 מכירות בחודש
          </span>
        </div>

        <div className={styles.cardBody}>
          {slowProducts.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: ".84rem", textAlign: "center", padding: "1rem" }}>
              ✅ כל המוצרים נמכרים כראוי!
            </div>
          ) : (
            slowProducts.map((p) => (
              <div
                key={p.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: ".75rem 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <img
                  src={p.img}
                  alt={p.name}
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: "cover",
                    borderRadius: 9,
                    border: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: ".88rem" }}>{p.name}</div>
                  <div
                    style={{
                      display: "flex",
                      gap: ".5rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginTop: ".25rem",
                    }}
                  >
                    <span className={styles.slowBadge}>🛒 {p.salesLastMonth} מכירות בחודש</span>
                    <span className={`${styles.tag} ${styles.tBlue}`} style={{ fontSize: ".62rem" }}>
                      {p.cat}
                    </span>
                    <span style={{ color: "var(--gold)", fontSize: ".8rem" }}>
                      ₪{p.price}
                    </span>
                  </div>
                </div>

                <button className={styles.btnPromote}>📢 פרסם</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
