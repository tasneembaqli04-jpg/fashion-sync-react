import { useMemo, useState } from "react";
import OrderDetailsModal from "../modals/OrderDetailsModal";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";
import ordersStyles from "../../../styles/manager/ManagerOrders.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";

const MONTH_NAMES = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function getMonthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthKey) {
  if (monthKey === "unknown") return "ללא תאריך";
  const [year, month] = monthKey.split("-");
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
}

export default function ManagerOrders({ orders = [], onConfirmOrder }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState(getMonthKey(new Date()));

  const availableMonths = useMemo(() => {
    const keys = new Set(orders.map((o) => getMonthKey(o.date || o.createdAt)));
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
  }, [orders]);

  const pending = orders.filter((o) => !o.confirmed).length;
  const confirmed = orders.filter((o) => o.confirmed).length;

  const visibleOrders = orders.filter((order) => {
    if (statusFilter === "ready" && !order.confirmed) return false;
    if (statusFilter === "pending" && order.confirmed) return false;

    if (monthFilter !== "all") {
      if (getMonthKey(order.date || order.createdAt) !== monthFilter) return false;
    }

    const term = searchTerm.trim();
    if (term) {
      const phoneDigits = term.replace(/\D/g, "");
      const customerPhone = String(order.customerDetails?.phone || "").replace(/\D/g, "");
      const matchesPhone = phoneDigits && customerPhone.includes(phoneDigits);
      const matchesOrderId = String(order.id || "").toLowerCase().includes(term.toLowerCase());

      if (!matchesPhone && !matchesOrderId) return false;
    }

    return true;
  });

  const cardStyle = (isActive) => ({
    cursor: "pointer",
    outline: isActive ? "2px solid #d6b65c" : "none",
    outlineOffset: "-2px",
  });

  return (
    <div className={layoutStyles.view}>
      <div className={uiStyles.pageHd}>
        <div className={uiStyles.phLeft}>
          <h2>הזמנות לקוחות</h2>
          <p>הזמנות שנפתחו — יש לאשר ולעקוב</p>
        </div>
      </div>

      <div
        className={overviewStyles.statsGrid}
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        <div
          className={`${overviewStyles.stat} ${overviewStyles.gold}`}
          style={cardStyle(statusFilter === "pending")}
          onClick={() => setStatusFilter("pending")}
        >
          <div className={overviewStyles.statIcon}>⏳</div>
          <div className={overviewStyles.statLabel}>ממתינות לאישור</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--orange)" }}
          >
            {pending}
          </div>
          <div className={overviewStyles.statSub}>לטיפול</div>
        </div>

        <div
          className={`${overviewStyles.stat} ${overviewStyles.blue}`}
          style={cardStyle(statusFilter === "all")}
          onClick={() => setStatusFilter("all")}
        >
          <div className={overviewStyles.statIcon}>📋</div>
          <div className={overviewStyles.statLabel}>סה"כ</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--blue)" }}
          >
            {orders.length}
          </div>
          <div className={overviewStyles.statSub}>הזמנות</div>
        </div>

        <div
          className={`${overviewStyles.stat} ${overviewStyles.green}`}
          style={cardStyle(statusFilter === "ready")}
          onClick={() => setStatusFilter("ready")}
        >
          <div className={overviewStyles.statIcon}>✅</div>
          <div
            className={overviewStyles.statLabel}
            style={{ color: "var(--green)" }}
          >
            מאושרות
          </div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--green)" }}
          >
            {confirmed}
          </div>
          <div className={overviewStyles.statSub}>טופלו</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="🔍 חיפוש לפי טלפון או מספר הזמנה (RCP-...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          dir="rtl"
          style={{
            flex: "1 1 320px",
            maxWidth: "400px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontSize: "0.95rem",
            textAlign: "right",
          }}
        />

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontSize: "0.95rem",
          }}
        >
          <option value="all">📅 כל החודשים</option>
          {availableMonths.map((key) => (
            <option key={key} value={key}>
              {getMonthLabel(key)}
            </option>
          ))}
        </select>
      </div>

      {!visibleOrders.length ? (
        <div className={ordersStyles.emptyState}>
          <div className={ordersStyles.emptyIcon}>🎉</div>
          <div className={ordersStyles.emptyText}>
            {orders.length ? "אין הזמנות תואמות לסינון" : "אין הזמנות פתוחות"}
          </div>
        </div>
      ) : (
        visibleOrders.map((order) => {
          const items = Array.isArray(order.items) ? order.items : [];

          const total =
            Number(order.total) ||
            items.reduce(
              (sum, item) =>
                sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
              0
            );

          const hasCustomSize = items.some((item) => item.isCustomSize);
          const dateText = fmtDate(order.date);

          return (
            <div className={ordersStyles.orderCard} key={order.id}>
              <div className={ordersStyles.orderHeader}>
                <div>
                  <div className={ordersStyles.orderCustomer}>📦 הזמנה</div>
                  <div className={ordersStyles.orderId}>{order.id}</div>
                  {!!dateText && (
                    <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                      🕒 {dateText}
                    </div>
                  )}
                </div>

                <div>
                  <span
                    className={`${uiStyles.tag} ${
                      order.confirmed ? uiStyles.tGreen : uiStyles.tYellow
                    }`}
                  >
                    {order.confirmed ? "✅ אושרה" : "⏳ ממתינה לאישור"}
                  </span>

                  {hasCustomSize && (
                    <span
                      className={uiStyles.tag}
                      style={{
                        marginRight: "0.4rem",
                        background: "rgba(230,126,34,0.12)",
                        border: "1px solid #e67e22",
                        color: "#e67e22",
                      }}
                    >
                      ⚠️ מידה מיוחדת
                    </span>
                  )}
                </div>
              </div>

              <div className={ordersStyles.orderStatusBar}>
                <span className={ordersStyles.orderTotal}>
                  ₪{total.toLocaleString()}
                </span>

                {!order.confirmed && (
                  <button
                    type="button"
                    className={ordersStyles.orderPrepareBtn}
                    style={{ background: "var(--green)", color: "#fff" }}
                    onClick={() => onConfirmOrder?.(order.docId)}
                  >
                    ✅ אשר הזמנה
                  </button>
                )}

                <button
                  type="button"
                  className={ordersStyles.orderPrepareBtn}
                  onClick={() => setSelectedOrder(order)}
                >
                  📋 פרטי הזמנה
                </button>
              </div>
            </div>
          );
        })
      )}

      <OrderDetailsModal
        open={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}