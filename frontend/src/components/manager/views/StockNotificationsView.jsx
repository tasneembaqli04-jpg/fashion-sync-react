import { useEffect, useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import {
  getAllStockNotifications,
  markStockNotificationDone,
  deleteStockNotification,
} from "../../../services/notifications/notificationsService";
import { sendStockAlertEmail } from "../../../services/email/emailService";
import { useDialog } from "../../common/DialogProvider";
import { useLanguage } from "../../../translations/LanguageProvider";
import MonthFilter from "../../common/MonthFilter";
import {
  getMonthKey,
  matchesMonthFilter,
} from "../../../functions/shared/monthFilter";
import { formatDateTime } from "../../../functions/shared/dateFormat";

export default function StockNotificationsView({ products = [], initialProductCode = "" }) {
  const { confirmDialog } = useDialog();
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.stockNotifications;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [monthFilter, setMonthFilter] = useState(() => getMonthKey(new Date()));
  const [productCodeFilter, setProductCodeFilter] = useState(initialProductCode);

  useEffect(() => {
    if (initialProductCode) setProductCodeFilter(initialProductCode);
  }, [initialProductCode]);

  useEffect(() => {
    getAllStockNotifications().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  async function handleMarkDone(id, item) {
    if (item?.email) {
      const product = products.find((p) => p.code === item.productCode);

      await sendStockAlertEmail({
        toEmail: item.email,
        productName: item.productName || item.productCode,
        productNameEn: product?.nameEn || "",
        lang,
      });
    }

    await markStockNotificationDone(id);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notified: true } : item))
    );
  }

  async function handleDelete(id) {
    const confirmed = await confirmDialog(t.confirmDeleteRequest);
    if (!confirmed) return;
    await deleteStockNotification(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  const pendingCount = items.filter((item) => !item.notified).length;

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === "pending" && item.notified) return false;
      if (statusFilter === "notified" && !item.notified) return false;
      if (!matchesMonthFilter(monthFilter, item.createdAt)) return false;
      if (productCodeFilter && item.productCode !== productCodeFilter) {
        return false;
      }
      return true;
    });
  }, [items, statusFilter, monthFilter, productCodeFilter]);

  return (
    <div className={layoutStyles.view}>
      <div className={uiStyles.pageHd}>
        <div className={uiStyles.phLeft}>
          <h2>{t.title}</h2>
          <p>
            {t.subtitle
              .replace("{pending}", pendingCount)
              .replace("{total}", items.length)}
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.3rem" }}>
            💡 {t.infoNote}
          </p>
        </div>
      </div>

      {productCodeFilter && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(52,152,219,0.1)",
            border: "1px solid var(--blue)",
            color: "var(--blue)",
            borderRadius: "20px",
            padding: "0.35rem 0.9rem",
            fontSize: "0.82rem",
            fontWeight: 700,
            marginBottom: "1rem",
          }}
        >
          {t.filteredByProduct} {productCodeFilter}
          <button
            type="button"
            onClick={() => setProductCodeFilter("")}
            style={{
              background: "none",
              border: "none",
              color: "var(--blue)",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "1.2rem",
        }}
      >
        {[
          { key: "all", label: t.filterAll },
          { key: "pending", label: t.filterPending },
          { key: "notified", label: t.filterNotified },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={uiStyles.filterTab}
            onClick={() => setStatusFilter(tab.key)}
            style={
              statusFilter === tab.key
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

        {/* Stock requests are filed by createdAt, when the customer asked. */}
        <MonthFilter
          records={items}
          getDate={(item) => item.createdAt}
          value={monthFilter}
          onChange={setMonthFilter}
        />
      </div>

      {loading ? (
        <div>{dict.common.loading}</div>
      ) : !visibleItems.length ? (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
          {t.noRequestsYet}
        </div>
      ) : (
        visibleItems.map((item) => (
          <div
            key={item.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-gold)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "12px",
              color: "var(--text)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.7rem",
            }}
          >
            <div>
              <strong>
                {(() => {
                  const product = products.find((p) => p.code === item.productCode);
                  return lang === "en" && product?.nameEn
                    ? product.nameEn
                    : item.productName || item.productCode;
                })()}
              </strong>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                {item.email && <span>✉️ {item.email} · </span>}
                {item.phone && <span>📞 {item.phone}</span>}
              </div>
              <div style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                🕒 {formatDateTime(item.createdAt, lang)}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              {!item.notified ? (
                <span
                  className={`${uiStyles.tag} ${uiStyles.tYellow}`}
                  title={t.autoHandleTooltip}
                >
                  {t.pendingStock}
                </span>
              ) : (
                <span className={`${uiStyles.tag} ${uiStyles.tGreen}`}>{t.notified}</span>
              )}

              <button
                type="button"
                className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
                onClick={() => handleDelete(item.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}