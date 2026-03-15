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
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlertsView({ alerts, products }) {
  const [typeFilter, setTypeFilter] = useState("");
  const [demandMin, setDemandMin] = useState(0);

  const filteredAlerts = useMemo(() => {
    let list = [...alerts];

    if (typeFilter === "oos") {
      list = list.filter((a) => a.key.startsWith("oos_"));
    } else if (typeFilter === "low") {
      list = list.filter((a) => a.key.startsWith("low_"));
    } else if (typeFilter === "demand") {
      list = list.filter((a) => a.isDemand);
    }

    if (demandMin > 0) {
      list = list.filter((a) => a.isDemand && (a.demandCount || 0) > demandMin);
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
      </div>

      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button className={styles.filterTab} onClick={() => setTypeFilter("")}>🔔 הכל</button>
        <button className={styles.filterTab} onClick={() => setTypeFilter("oos")}>🚫 אזל מהמלאי</button>
        <button className={styles.filterTab} onClick={() => setTypeFilter("low")}>⚠️ מלאי נמוך</button>
        <button className={styles.filterTab} onClick={() => setTypeFilter("demand")}>🔥 ביקוש גבוה</button>

        <select
          className={styles.fpInput}
          style={{ maxWidth: 180 }}
          value={demandMin}
          onChange={(e) => setDemandMin(Number(e.target.value))}
        >
          <option value={0}>הכל</option>
          <option value={15}>גדול מ־15</option>
          <option value={30}>גדול מ־30</option>
          <option value={60}>גדול מ־60</option>
        </select>
      </div>

      <div>
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const product = products.find((p) => p.code === alert.code);
            const img =
              product?.img ||
              "https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=400";

            return (
              <div key={alert.key} className={alertClass(alert.type)}>
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
                  <div style={{ opacity: 0.65, fontSize: ".78rem", marginTop: ".15rem" }}>
                    🕒 {fmtDate(alert.createdAt)}
                  </div>
                </div>
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
