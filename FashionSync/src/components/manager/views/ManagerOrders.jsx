import { useState } from "react";
import OrderDetailsModal from "../modals/OrderDetailsModal";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";
import ordersStyles from "../../../styles/manager/ManagerOrders.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";

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

export default function ManagerOrders({ orders = [], onToggleOrderReady }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | ready
  const [phoneSearch, setPhoneSearch] = useState("");

  const pending = orders.filter(
    (o) => o.status === "pending" || o.status === "waiting" || !o.status
  ).length;

  const ready = orders.filter(
    (o) =>
      o.status === "ready" ||
      o.status === "done" ||
      o.status === "completed"
  ).length;

  const visibleOrders = orders.filter((order) => {
    const isReady =
      order.status === "ready" ||
      order.status === "done" ||
      order.status === "completed";

    if (statusFilter === "ready" && !isReady) return false;
    if (statusFilter === "pending" && isReady) return false;

    const phoneDigits = String(phoneSearch).replace(/\D/g, "");
    if (phoneDigits) {
      const customerPhone = String(
        order.customerDetails?.phone || ""
      ).replace(/\D/g, "");
      if (!customerPhone.includes(phoneDigits)) return false;
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
          <p>הזמנות שנפתחו — יש להכין ולסמן כמוכן</p>
        </div>
      </div>

      <div
        className={overviewStyles.statsGrid}
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
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
            מוכנות
          </div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--green)" }}
          >
            {ready}
          </div>
          <div className={overviewStyles.statSub}>להגשה</div>
        </div>

        <div
          className={`${overviewStyles.stat} ${overviewStyles.gold}`}
          style={cardStyle(statusFilter === "pending")}
          onClick={() => setStatusFilter("pending")}
        >
          <div className={overviewStyles.statIcon}>⏳</div>
          <div className={overviewStyles.statLabel}>ממתינות</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--orange)" }}
          >
            {pending}
          </div>
          <div className={overviewStyles.statSub}>לטיפול</div>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="tel"
          placeholder="🔍 חיפוש לפי טלפון לקוח..."
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
          dir="rtl"
          style={{
            width: "100%",
            maxWidth: "320px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontSize: "0.95rem",
            textAlign: "right",
          }}
        />
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

          const isReady =
            order.status === "ready" ||
            order.status === "done" ||
            order.status === "completed";

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
                      isReady ? uiStyles.tGreen : uiStyles.tYellow
                    }`}
                  >
                    {isReady ? "✅ מוכן להגשה" : "⏳ ממתין להכנה"}
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

                <button
                  type="button"
                  className={ordersStyles.orderPrepareBtn}
                  onClick={() => setSelectedOrder(order)}
                >
                  📋 פרטי הזמנה
                </button>

                <button
                  type="button"
                  className={`${ordersStyles.orderPrepareBtn} ${
                    isReady ? ordersStyles.done : ""
                  }`}
                  onClick={() => onToggleOrderReady?.(order.id)}
                >
                  {isReady ? "✓ מוכן" : "הכן להגשה"}
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