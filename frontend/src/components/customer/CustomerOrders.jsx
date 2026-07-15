import { useMemo, useState } from "react";
import commonStyles from "../../styles/customer/Customer.module.scss";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";

const STATUS_LABELS = ["אושרה", "בהכנה", "נשלחה", "נמסרה"];

const FILTERS = [
  { key: "all", label: "הכל" },
  { key: 0, label: "אושרה" },
  { key: 1, label: "בהכנה" },
  { key: 2, label: "נשלחה" },
  { key: 3, label: "נמסרה" },
];

export default function CustomerOrders({ show, orders = [] }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const sortedOrders = useMemo(() => {
    const withStatus = orders.map((order) => ({
      ...order,
      _statusNum: Number(order.status) || 0,
      _timestamp: new Date(order.createdAt || order.date || 0).getTime() || 0,
    }));

    return withStatus.sort((a, b) => {
      const aDelivered = a._statusNum === 3;
      const bDelivered = b._statusNum === 3;

      if (aDelivered !== bDelivered) {
        return aDelivered ? 1 : -1;
      }

      if (!aDelivered) {
        return a._timestamp - b._timestamp;
      }

      return b._timestamp - a._timestamp;
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return sortedOrders;
    return sortedOrders.filter((order) => order._statusNum === activeFilter);
  }, [sortedOrders, activeFilter]);

  const countsByStatus = useMemo(() => {
    const counts = { all: sortedOrders.length, 0: 0, 1: 0, 2: 0, 3: 0 };
    sortedOrders.forEach((order) => {
      counts[order._statusNum] = (counts[order._statusNum] || 0) + 1;
    });
    return counts;
  }, [sortedOrders]);

  if (!show) return null;

  return (
    <div>
      <div className={commonStyles.pageTitle}>📦 ההזמנות שלי</div>
      <div className={commonStyles.pageSub}>מעקב אחרי הזמנות ומשלוחים</div>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1.2rem",
        }}
      >
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                border: isActive
                  ? "1.5px solid var(--gold)"
                  : "1px solid var(--border)",
                background: isActive ? "rgba(201,168,76,0.12)" : "transparent",
                color: isActive ? "var(--gold)" : "var(--muted)",
                fontFamily: "Alef, sans-serif",
                fontSize: "0.85rem",
                fontWeight: isActive ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {label} ({countsByStatus[key] ?? 0})
            </button>
          );
        })}
      </div>

      {filteredOrders.length ? (
        filteredOrders.map((order) => {
          const steps =
            Array.isArray(order.steps) && order.steps.length
              ? order.steps
              : STATUS_LABELS;
          const status = order._statusNum;

          return (
            <div key={order.id} className={modalStyles.orderCard}>
              <div className={modalStyles.orderTop}>
                <div>
                  <div style={{ fontWeight: 900 }}>{order.id}</div>
                  <div className={modalStyles.orderId}>{order.date}</div>
                </div>
                <div
                  style={{
                    color: "var(--gold)",
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "1.05rem",
                    fontWeight: 900,
                  }}
                >
                  ₪{order.total}
                </div>
              </div>

              <div className={modalStyles.orderItems}>
                {order.items.map((item, index) => (
                  <span key={index}>
                    {item.name} ×{item.qty}
                    {index < order.items.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>

              <div className={modalStyles.orderTimeline}>
                <div className={modalStyles.orderTimelineLine} />

                {steps.map((step, index) => {
                  const isDone = index <= status;
                  const isActive = index === status;

                  return (
                    <div className={modalStyles.orderStep} key={index}>
                      <div
                        className={`${modalStyles.orderDot} ${
                          isDone ? modalStyles.orderDotDone : ""
                        } ${isActive ? modalStyles.orderDotActive : ""}`}
                      >
                        {isDone ? "✓" : ""}
                      </div>

                      <div
                        className={`${modalStyles.orderStepLabel} ${
                          isActive ? modalStyles.orderStepLabelActive : ""
                        }`}
                      >
                        {step}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className={commonStyles.card} style={{ textAlign: "center" }}>
          אין הזמנות במצב הזה
        </div>
      )}
    </div>
  );
}