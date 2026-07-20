import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import alertStyles from "../../../styles/manager/ManagerAlerts.module.scss";
import { useLanguage } from "../../../translations/LanguageProvider";

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

export default function OverviewView({
  stats,
  alerts,
  products,
  receipts,
  onOpenAlerts,
  onPromote,
  promotedCode,
}) {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.overview;
  const locale = lang === "en" ? "en-US" : "he-IL";

  function fmtDate(date) {
    return new Date(date).toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const today = new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const weekLabels = weekDays.map((d) =>
    d.toLocaleDateString(locale, { weekday: "short" })
  );

  const weekSales = weekDays.map((day) => {
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return receipts
      .filter((r) => {
        const rDate = new Date(r.date);
        return rDate >= day && rDate <= dayEnd;
      })
      .reduce((sum, r) => sum + (Number(r.total) || 0), 0);
  });

  const max = Math.max(1, ...weekSales);

  const slowProducts = products.filter((p) => p.stock > 0 && (p.salesLastMonth || 0) <= 2);

  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>{t.greeting}</h2>
          <p>{today}</p>
        </div>

        <div style={{ display: "flex", gap: ".5rem" }}>
          <span className={`${uiStyles.tag} ${uiStyles.tGreen}`}>{t.connected}</span>
          <span className={`${uiStyles.tag} ${uiStyles.tGold}`}>FashionSync</span>
        </div>
      </div>

      <div className={overviewStyles.statsGrid}>
        <div className={`${overviewStyles.stat} ${overviewStyles.gold}`}>
          <div className={overviewStyles.statIcon}>📦</div>
          <div className={overviewStyles.statLabel}>{t.stockItems}</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--gold)" }}
          >
            {stats.totalStock}
          </div>
          <div className={`${overviewStyles.statSub} ${overviewStyles.up}`}>
            {stats.productCount} {t.productsSuffix}
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.green}`}>
          <div className={overviewStyles.statIcon}>💰</div>
          <div className={overviewStyles.statLabel}>{t.sales}</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--green)" }}
          >
            ₪{stats.sales.toLocaleString()}
          </div>
          <div className={`${overviewStyles.statSub} ${overviewStyles.up}`}>
            {stats.receiptCount} {t.transactionsSuffix}
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.red}`}>
          <div className={overviewStyles.statIcon}>⚠️</div>
          <div className={overviewStyles.statLabel}>{t.stockIssues}</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--red)" }}
          >
            {stats.lowCount}
          </div>
          <div className={`${overviewStyles.statSub} ${overviewStyles.dn}`}>
            {t.needsAttention}
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.blue}`}>
          <div className={overviewStyles.statIcon}>🔥</div>
          <div className={overviewStyles.statLabel}>{t.highDemand}</div>
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
            <div className={uiStyles.cardTitle}>{t.activeAlerts}</div>
            <button
              className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
              style={{ fontSize: ".72rem", padding: ".3rem .7rem" }}
              onClick={onOpenAlerts}
            >
              {t.seeAll}
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
                {t.noActiveAlerts}
              </div>
            )}
          </div>
        </div>

        <div className={uiStyles.card}>
          <div className={uiStyles.cardHd}>
            <div className={uiStyles.cardTitle}>{t.weeklySales}</div>
            <span className={`${uiStyles.tag} ${uiStyles.tGold}`}>{t.perDay}</span>
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
              {weekLabels.map((label, index) => (
                <span
                  key={index}
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
            {t.slowMovingTitle}
          </div>
          <span
            className={`${uiStyles.tag} ${uiStyles.tOrange}`}
            style={{ fontSize: ".65rem" }}
          >
            {t.slowMovingTag}
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
              {t.allSellingWell}
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
                        🛒 {p.salesLastMonth} {t.salesThisMonth}
                      </span>
                      <span
                        className={`${uiStyles.tag} ${uiStyles.tBlue}`}
                        style={{ fontSize: ".62rem" }}
                      >
                        {dict.categoryLabels[p.cat] || p.cat}
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
                    {isPromoted ? t.promoted : t.promoteButton}
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