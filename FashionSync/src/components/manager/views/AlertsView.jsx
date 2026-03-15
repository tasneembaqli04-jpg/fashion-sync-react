import { useMemo, useState } from "react";
import styles from "../../../styles/Manager.module.scss";

function buildAlertsFromProducts(products) {
  const alerts = [];

  products.forEach((product) => {
    const requests = Number(product.notifyCount || 0);

    if (product.stock === 0) {
      alerts.push({
        id: `${product.code}-out`,
        type: "out",
        label: "אזל מהמלאי",
        requests,
        productName: product.name,
        productCode: product.code,
        img: product.img,
        message: `${product.name} אזל מהמלאי`,
        className: styles.aDanger,
        icon: "🚫",
      });

      if (requests > 15) {
        alerts.push({
          id: `${product.code}-demand`,
          type: "demand",
          label: "ביקושים גבוהים",
          requests,
          productName: product.name,
          productCode: product.code,
          img: product.img,
          message: `${product.name} — נרשמו ${requests} בקשות לעדכון כשיחזור למלאי`,
          className: styles.aWarn,
          icon: "🔥",
        });
      }
    } else if (product.stock <= product.minStock) {
      alerts.push({
        id: `${product.code}-low`,
        type: "low",
        label: "מלאי נמוך",
        requests: 0,
        productName: product.name,
        productCode: product.code,
        img: product.img,
        message: `${product.name} — נותרו ${product.stock} יח׳`,
        className: styles.aWarn,
        icon: "⚠️",
      });
    }
  });

  return alerts;
}


export default function AlertsView({ products = [] }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [alertTypeFilter, setAlertTypeFilter] = useState("all");
  const [requestsFilter, setRequestsFilter] = useState("all");

  const alerts = useMemo(() => {
    return buildAlertsFromProducts(products);
  }, [products]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesType =
        alertTypeFilter === "all" ? true : alert.type === alertTypeFilter;

      const matchesRequests =
        requestsFilter === "all"
          ? true
          : requestsFilter === "gt15"
            ? alert.requests > 15
            : requestsFilter === "gt30"
              ? alert.requests > 30
              : requestsFilter === "gt60"
                ? alert.requests > 60
                : true;

      return matchesType && matchesRequests;
    });
  }, [alerts, alertTypeFilter, requestsFilter]);

  const activeFiltersCount =
    (alertTypeFilter !== "all" ? 1 : 0) + (requestsFilter !== "all" ? 1 : 0);

  function resetFilters() {
    setAlertTypeFilter("all");
    setRequestsFilter("all");
  }

  return (
    <div className={styles.view}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>התראות מערכת</h2>
          <p>נשמרות לשבוע ומתעדכנות לפי מצב המוצרים</p>
        </div>
      </div>

      <div style={{ marginBottom: "0.7rem" }}>
        <button
          className={`${styles.filterToggleBtn} ${
            filtersOpen ? styles.active : ""
          }`}
          onClick={() => setFiltersOpen((prev) => !prev)}
        >
          🔽 סינון
          <span
            className={styles.filterBadge}
            style={{ display: activeFiltersCount ? "inline-flex" : "none" }}
          >
            {activeFiltersCount}
          </span>
        </button>
      </div>

      <div
        className={`${styles.filterPanel} ${filtersOpen ? styles.open : ""}`}
      >
        <div className={styles.fpGrid}>
          <div className={styles.fpField}>
            <div className={styles.fpLabel}>סוג התראה</div>
            <select
              className={styles.fpInput}
              value={alertTypeFilter}
              onChange={(e) => setAlertTypeFilter(e.target.value)}
            >
              <option value="all">הכל</option>
              <option value="out">אזל מהמלאי</option>
              <option value="low">מלאי נמוך</option>
              <option value="demand">ביקושים גבוהים</option>
            </select>
          </div>

          <div className={styles.fpField}>
            <div className={styles.fpLabel}>מספר ביקושים</div>
            <select
              className={styles.fpInput}
              value={requestsFilter}
              onChange={(e) => setRequestsFilter(e.target.value)}
            >
              <option value="all">הכל</option>
              <option value="gt15">יותר מ־15</option>
              <option value="gt30">יותר מ־30</option>
              <option value="gt60">יותר מ־60</option>

            </select>
          </div>
        </div>

        <div className={styles.fpActions}>
          <button className={styles.fpReset} onClick={resetFilters}>
            ✕ אפס
          </button>
        </div>
      </div>

      <div>
        {filteredAlerts.length === 0 ? (
          <div className={`${styles.alert} ${styles.aSuccess}`}>
            ✅ אין התראות בסינון הנוכחי
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div key={alert.id} className={`${styles.alert} ${alert.className}`}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  width: "100%",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, marginBottom: "0.2rem" }}>
                    {alert.icon} {alert.label}
                  </div>
                  <div>{alert.message}</div>
                </div>

                {alert.img && (
                  <img
                    src={alert.img}
                    alt={alert.productName}
                    className={styles.ptb}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
