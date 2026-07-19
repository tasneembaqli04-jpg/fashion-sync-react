import { useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import alertStyles from "../../../styles/manager/ManagerAlerts.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import formStyles from "../../../styles/manager/ManagerForms.module.scss";
import { useLanguage } from "../../../translations/LanguageProvider";

function alertClass(type) {
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

export default function AlertsView({ alerts = [], products = [] }) {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.alerts;
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

  const TABS = [
    { key: "", label: t.tabAll },
    { key: "oos", label: t.tabOutOfStock },
    { key: "low", label: t.tabLowStock },
    { key: "demand", label: t.tabHighDemand },
    { key: "customsize", label: t.tabCustomSize },
  ];

  const [typeFilter, setTypeFilter] = useState("");
  const [demandMin, setDemandMin] = useState(15);

  const counts = useMemo(
    () => ({
      all: alerts.length,
      oos: alerts.filter((a) => a.key.startsWith("oos_")).length,
      low: alerts.filter((a) => a.key.startsWith("low_")).length,
      demand: alerts.filter((a) => a.isDemand).length,
      customsize: alerts.filter((a) => a.key.startsWith("customsize_")).length,
    }),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    let list = [...alerts];

    if (typeFilter === "oos") {
      list = list.filter((a) => a.key.startsWith("oos_"));
    } else if (typeFilter === "low") {
      list = list.filter((a) => a.key.startsWith("low_"));
    } else if (typeFilter === "demand") {
      list = list.filter((a) => a.isDemand);
    } else if (typeFilter === "customsize") {
      list = list.filter((a) => a.key.startsWith("customsize_"));
    }

    if (typeFilter === "demand") {
      list = list.filter((a) => (a.demandCount || 0) > demandMin);
    }

    return list;
  }, [alerts, typeFilter, demandMin]);

  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: ".5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={uiStyles.filterTab}
            onClick={() => {
              setTypeFilter(tab.key);
              setDemandMin(15);
            }}
            style={
              typeFilter === tab.key
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

        {typeFilter === "demand" && (
          <select
            className={formStyles.fpInput}
            style={{ maxWidth: 160 }}
            value={demandMin}
            onChange={(e) => setDemandMin(Number(e.target.value))}
          >
            <option value={15}>{t.greaterThan15}</option>
            <option value={30}>{t.greaterThan30}</option>
            <option value={60}>{t.greaterThan60}</option>
          </select>
        )}
      </div>

      {typeFilter === "" && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "0.6rem 1.1rem",
            fontSize: "0.82rem",
            color: "var(--muted)",
            marginBottom: "1rem",
          }}
        >
          <span>
            {t.total} <strong style={{ color: "var(--text)" }}>{counts.all}</strong>
          </span>
          <span style={{ color: "var(--red)" }}>🚫 {counts.oos}</span>
          <span style={{ color: "#f39c12" }}>⚠️ {counts.low}</span>
          <span style={{ color: "#7fb8e0" }}>🔥 {counts.demand}</span>
        </div>
      )}

      <div>
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const product = products.find((p) => p.code === alert.code);
            const img =
              product?.img ||
              "https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=400";

            return (
              <div
                key={alert.key}
                className={alertClass(alert.type)}
                style={{ justifyContent: "space-between", flexWrap: "wrap" }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <img
                    src={img}
                    alt={alert.title}
                    style={{
                      width: 44,
                      height: 44,
                      objectFit: "cover",
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <strong>{alert.title}</strong>

                    <div style={{ opacity: 0.92 }}>{alert.msg}</div>

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

                {alert.isDemand && (
                  <span
                    style={{
                      background: "rgba(52,152,219,0.1)",
                      color: "#7fb8e0",
                      border: "1px solid rgba(52,152,219,0.2)",
                      borderRadius: "20px",
                      padding: "0.2rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      flexShrink: 0,
                      alignSelf: "center",
                    }}
                  >
                    {alert.demandCount} {t.requestsSuffix}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div className={`${alertStyles.alert} ${alertStyles.aSuccess}`}>
            {t.noAlertsInFilter}
          </div>
        )}
      </div>
    </div>
  );
}