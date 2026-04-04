import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import alertStyles from "../../../styles/manager/ManagerAlerts.module.scss";

function getAlertClass(type) {
  if (type === "danger") {
    return `${alertStyles.alert} ${alertStyles.aDanger}`;
  }
  if (type === "warn") {
    return `${alertStyles.alert} ${alertStyles.aWarn}`;
  }
  if (type === "info") {
    return `${alertStyles.alert} ${alertStyles.aInfo}`;
  }
  return `${alertStyles.alert} ${alertStyles.aSuccess}`;
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

export default function OverviewView({
  stats,
  alerts,
  products,
  receipts,
  onOpenAlerts,
  onPromote,
  promotedCode,
}) {
  const today = new Date().toLocaleDateString("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const weekSales = [4200, 5800, 3900, 7200, 6100, 8450, 5300];
  const weekLabels = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
  const max = Math.max(...weekSales);

  const slowProducts = products.filter((p) => p.stock > 0 && p.salesLastMonth <= 2);

  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>שלום 👋</h2>
          <p>{today}</p>
        </div>

        <div style={{ display: "flex", gap: ".5rem" }}>
          <span className={`${uiStyles.tag} ${uiStyles.tGreen}`}>● מחובר</span>
          <span className={`${uiStyles.tag} ${uiStyles.tGold}`}>FashionSync</span>
        </div>
      </div>

      <div className={overviewStyles.statsGrid}>
        <div className={`${overviewStyles.stat} ${overviewStyles.gold}`}>
          <div className={overviewStyles.statIcon}>📦</div>
          <div className={overviewStyles.statLabel}>פריטים במלאי</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--gold)" }}
          >
            {stats.totalStock}
          </div>
          <div className={`${overviewStyles.statSub} ${overviewStyles.up}`}>
            {stats.productCount} מוצרים
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.green}`}>
          <div className={overviewStyles.statIcon}>💰</div>
          <div className={overviewStyles.statLabel}>מכירות</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--green)" }}
          >
            ₪{stats.sales.toLocaleString()}
          </div>
          <div className={`${overviewStyles.statSub} ${overviewStyles.up}`}>
            {stats.receiptCount} עסקאות
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.red}`}>
          <div className={overviewStyles.statIcon}>⚠️</div>
          <div className={overviewStyles.statLabel}>בעיות מלאי</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--red)" }}
          >
            {stats.lowCount}
          </div>
          <div className={`${overviewStyles.statSub} ${overviewStyles.dn}`}>
            דורש טיפול
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.blue}`}>
          <div className={overviewStyles.statIcon}>🔥</div>
          <div className={overviewStyles.statLabel}>ביקושים גבוהים</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--blue)" }}
          >
            {stats.demandCount}
          </div>
          <div className={overviewStyles.statSub}>notifyCount &gt; 15</div>
        </div>
      </div>

      <div className={layoutStyles.g2}>
        <div className={uiStyles.card}>
          <div className={uiStyles.cardHd}>
            <div className={uiStyles.cardTitle}>🔔 התראות פעילות</div>
            <button
              className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
              style={{ fontSize: ".72rem", padding: ".3rem .7rem" }}
              onClick={onOpenAlerts}
            >
              הכל ←
            </button>
          </div>

          <div className={uiStyles.cardBody}>
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
                      <div
                        style={{
                          opacity: 0.65,
                          fontSize: ".78rem",
                          marginTop: ".15rem",
                        }}
                      >
                        🕒 {fmtDate(alert.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`${alertStyles.alert} ${alertStyles.aSuccess}`}>
                ✅ אין התראות פעילות
              </div>
            )}
          </div>
        </div>

        <div className={uiStyles.card}>
          <div className={uiStyles.cardHd}>
            <div className={uiStyles.cardTitle}>📊 מכירות שבועיות</div>
            <span className={`${uiStyles.tag} ${uiStyles.tGold}`}>₪ לפי יום</span>
          </div>

          <div className={uiStyles.cardBody}>
            <div className={overviewStyles.miniBars}>
              {weekSales.map((value, index) => (
                <div
                  key={index}
                  className={`${overviewStyles.mbar} ${
                    index === 5 ? overviewStyles.hi : ""
                  }`}
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

      <div className={uiStyles.card}>
        <div className={uiStyles.cardHd}>
          <div className={uiStyles.cardTitle}>
            📦 מוצרים שלא נמכרים — מועמדים לפרסום
          </div>
          <span
            className={`${uiStyles.tag} ${uiStyles.tOrange}`}
            style={{ fontSize: ".65rem" }}
          >
            0–2 מכירות בחודש
          </span>
        </div>

        <div className={uiStyles.cardBody}>
          {slowProducts.length === 0 ? (
            <div
              style={{
                color: "var(--muted)",
                fontSize: ".84rem",
                textAlign: "center",
                padding: "1rem",
              }}
            >
              ✅ כל המוצרים נמכרים כראוי!
            </div>
          ) : (
            slowProducts.map((p) => {
              const isPromoted = promotedCode === p.code;

              return (
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
                    <div style={{ fontWeight: 700, fontSize: ".88rem" }}>
                      {p.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: ".5rem",
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginTop: ".25rem",
                      }}
                    >
                      <span className={uiStyles.slowBadge}>
                        🛒 {p.salesLastMonth} מכירות בחודש
                      </span>
                      <span
                        className={`${uiStyles.tag} ${uiStyles.tBlue}`}
                        style={{ fontSize: ".62rem" }}
                      >
                        {p.cat}
                      </span>
                      <span style={{ color: "var(--gold)", fontSize: ".8rem" }}>
                        ₪{p.price}
                      </span>
                    </div>
                  </div>

                  <button
                    style={{
                      background: isPromoted
                        ? "linear-gradient(135deg, #2ecc71, #27ae60)"
                        : "linear-gradient(135deg, #ff6b35, #f7c59f)",
                      color: isPromoted ? "#fff" : "#1a0a00",
                      padding: ".35rem .9rem",
                      fontSize: ".75rem",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontFamily: "Alef, sans-serif",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => onPromote(p)}
                  >
                    {isPromoted ? "✅ בפרסום" : "📢 פרסם"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}