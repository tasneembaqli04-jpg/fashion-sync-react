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

function getMonthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function StockNotificationsView() {
  const { confirmDialog } = useDialog();
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.stockNotifications;
  const MONTH_NAMES = dict.monthNames;
  const locale = lang === "en" ? "en-US" : "he-IL";

  function fmtDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getMonthLabel(monthKey) {
    if (monthKey === "unknown") return dict.customer.orders.noDate;
    const [year, month] = monthKey.split("-");
    return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
  }

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  useEffect(() => {
    getAllStockNotifications().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  async function handleMarkDone(id, item) {
    if (item?.email) {
      await sendStockAlertEmail({
        toEmail: item.email,
        productName: item.productName || item.productCode,
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

  const availableMonths = useMemo(() => {
    const keys = new Set(items.map((item) => getMonthKey(item.createdAt)));
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
  }, [items]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === "pending" && item.notified) return false;
      if (statusFilter === "notified" && !item.notified) return false;
      if (monthFilter !== "all" && getMonthKey(item.createdAt) !== monthFilter) {
        return false;
      }
      return true;
    });
  }, [items, statusFilter, monthFilter]);

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

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontSize: "0.9rem",
          }}
        >
          <option value="all">{t.allMonths}</option>
          {availableMonths.map((key) => (
            <option key={key} value={key}>
              {getMonthLabel(key)}
            </option>
          ))}
        </select>
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
              <strong>{item.productName || item.productCode}</strong>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                {item.email && <span>✉️ {item.email} · </span>}
                {item.phone && <span>📞 {item.phone}</span>}
              </div>
              <div style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                🕒 {fmtDate(item.createdAt)}
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