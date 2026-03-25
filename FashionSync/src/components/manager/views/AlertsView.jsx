import { useMemo, useState } from "react";
import styles from "../../../styles/Manager.module.scss";

function alertClass(type) {
  if (type === "danger") return `${styles.alert} ${styles.aDanger}`;
  if (type === "warn") return `${styles.alert} ${styles.aWarn}`;
  if (type === "info") return `${styles.alert} ${styles.aInfo}`;
  return `${styles.alert} ${styles.aSuccess}`;
}

function fmtDate(date) {
  return new Date(date).toLocaleString("he-IL", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

const TABS = [
  { key: "", label: "🔔 הכל" },
  { key: "oos", label: "🚫 אזל מהמלאי" },
  { key: "low", label: "⚠️ מלאי נמוך" },
  { key: "demand", label: "🔥 ביקוש גבוה" },
];

export default function AlertsView({ alerts, products }) {
  const [typeFilter, setTypeFilter] = useState("");
  const [demandMin, setDemandMin] = useState(0);

  const counts = useMemo(() => ({
    all: alerts.length,
    oos: alerts.filter((a) => a.key.startsWith("oos_")).length,
    low: alerts.filter((a) => a.key.startsWith("low_")).length,
    demand: alerts.filter((a) => a.isDemand).length,
  }), [alerts]);

  const filteredAlerts = useMemo(() => {
    let list = [...alerts];
    if (typeFilter === "oos") list = list.filter((a) => a.key.startsWith("oos_"));
    else if (typeFilter === "low") list = list.filter((a) => a.key.startsWith("low_"));
    else if (typeFilter === "demand") list = list.filter((a) => a.isDemand);

    if (typeFilter === "demand" && demandMin > 0) {
      list = list.filter((a) => (a.demandCount || 0) > demandMin);
    }

    return list;
  }, [alerts, typeFilter, demandMin]);

  return (
    <div className={`${styles.view} ${styles.active}`}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>התראות מערכת</h2>
          <p>נשמרות לשבוע אחד ומתעדכנות לפי מצב המוצרים</p>
        </div>
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "0.6rem 1.1rem",
          fontSize: "0.82rem",
          color: "var(--muted)",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
        }}>
          <span>סה״כ: <strong style={{ color: "var(--text)" }}>{counts.all}</strong></span>
          <span style={{ color: "var(--red)" }}>🚫 {counts.oos}</span>
          <span style={{ color: "#f39c12" }}>⚠️ {counts.low}</span>
          <span style={{ color: "#7fb8e0" }}>🔥 {counts.demand}</span>
        </div>
      </div>

     
      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={styles.filterTab}
            onClick={() => { setTypeFilter(tab.key); setDemandMin(0); }}
            style={typeFilter === tab.key ? {
              background: "var(--gold-dim)",
              color: "var(--gold)",
              borderColor: "var(--border-gold)",
            } : {}}
          >
            {tab.label}
          </button>
        ))}

        
        {typeFilter === "demand" && (
          <select
            className={styles.fpInput}
            style={{ maxWidth: 180, marginRight: "auto" }}
            value={demandMin}
            onChange={(e) => setDemandMin(Number(e.target.value))}
          >
            <option value={0}>כל הביקושים</option>
            <option value={15}>גדול מ־15</option>
            <option value={30}>גדול מ־30</option>
            <option value={60}>גדול מ־60</option>
          </select>
        )}
      </div>

      
      <div>
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const product = products.find((p) => p.code === alert.code);
            const img = product?.img ||
              "https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=400";

            return (
              <div key={alert.key} className={alertClass(alert.type)}
                style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: 1 }}>
                  <img src={img} alt={alert.title}
                    style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <strong>{alert.title}</strong>
                    <div style={{ opacity: 0.92 }}>{alert.msg}</div>
                    <div style={{ opacity: 0.65, fontSize: ".78rem", marginTop: ".15rem" }}>
                      🕒 {fmtDate(alert.createdAt)}
                    </div>
                  </div>
                </div>

                
                {alert.isDemand && (
                  <span style={{
                    background: "rgba(52,152,219,0.1)",
                    color: "#7fb8e0",
                    border: "1px solid rgba(52,152,219,0.2)",
                    borderRadius: "20px",
                    padding: "0.2rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    flexShrink: 0,
                    alignSelf: "center",
                  }}>
                    {alert.demandCount} בקשות
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div className={`${styles.alert} ${styles.aSuccess}`}>
            ✅ אין התראות בסינון הנוכחי
          </div>
        )}
      </div>
    </div>
  );
}