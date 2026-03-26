import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";
import ordersStyles from "../../styles/employee/EmployeeOrders.module.scss";

const STATUS_LABELS = {
  waiting: { label: "ממתין לשליח", color: "#f59e0b" },
  picked: { label: "נאסף על ידי שליח", color: "var(--blue)" },
  on_the_way: { label: "בדרך ללקוח", color: "var(--purple, #a855f7)" },
  delivered: { label: "נמסר ללקוח", color: "var(--green)" },
};

const STATUS_STEPS = ["waiting", "picked", "on_the_way", "delivered"];

function fmtDate(ts) {
  return new Date(ts).toLocaleString("he-IL", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function EmployeeDeliveries({ deliveries, onUpdateStatus }) {
  return (
    <div className={`${layoutStyles.panel} ${layoutStyles.active}`}>
      <div className={layoutStyles.pageHeader}>
        <div className={layoutStyles.pageTitle}>מעקב משלוחים</div>
        <div className={layoutStyles.pageSub}>
          עדכן סטטוס משלוח עבור כל הזמנה מוכנה
        </div>
      </div>

      {!deliveries.length ? (
        <div className={layoutStyles.emptyState}>
          <div className={layoutStyles.emptyIcon}>🚚</div>
          <div className={layoutStyles.emptyText}>אין משלוחים פעילים</div>
        </div>
      ) : (
        deliveries.map((delivery) => {
          const currentIndex = STATUS_STEPS.indexOf(delivery.status);
          const statusInfo = STATUS_LABELS[delivery.status];

          return (
            <div className={ordersStyles.orderCard} key={delivery.id}>
              <div className={ordersStyles.orderHeader}>
                <div>
                  <div className={ordersStyles.orderCustomer}>
                    👤 {delivery.customer}
                  </div>
                  <div className={ordersStyles.orderId}>
                    {delivery.id} · הזמנה {delivery.orderId}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                    🕒 {fmtDate(delivery.createdAt)}
                  </div>
                </div>
                <span style={{
                  background: "rgba(0,0,0,0.15)",
                  border: `1px solid ${statusInfo.color}`,
                  color: statusInfo.color,
                  borderRadius: "20px",
                  padding: "0.2rem 0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}>
                  {statusInfo.label}
                </span>
              </div>

              <div style={{
                display: "flex",
                gap: "0",
                margin: "0.9rem 0",
                position: "relative",
              }}>
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentIndex;
                  const info = STATUS_LABELS[step];
                  return (
                    <div key={step} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                      {i < STATUS_STEPS.length - 1 && (
                        <div style={{
                          position: "absolute",
                          top: "11px",
                          right: "50%",
                          width: "100%",
                          height: "2px",
                          background: done && i < currentIndex ? "var(--green)" : "var(--border)",
                          zIndex: 0,
                        }} />
                      )}
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: done ? info.color : "var(--surface3, #1c1c26)",
                        border: `2px solid ${done ? info.color : "var(--border)"}`,
                        margin: "0 auto 0.35rem",
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.6rem",
                        color: "#fff",
                        fontWeight: 900,
                      }}>
                        {done ? "✓" : ""}
                      </div>
                      <div style={{
                        fontSize: "0.62rem",
                        color: done ? info.color : "var(--text-dim)",
                        fontWeight: done ? 700 : 400,
                        lineHeight: 1.3,
                      }}>
                        {info.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={ordersStyles.orderItemsList}>
                {delivery.items.map((item, index) => (
                  <div className={ordersStyles.orderItemRow} key={index}>
                    <img
                      className={ordersStyles.orderItemImg}
                      src={item.img}
                      alt={item.name}
                    />
                    <div className={ordersStyles.orderItemInfo}>
                      <div className={ordersStyles.orderItemName}>{item.name}</div>
                      <div className={ordersStyles.orderItemMeta}>
                        מידה: {item.size} · כמות: {item.qty} · ₪{item.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {delivery.status !== "delivered" && (
                <div className={ordersStyles.orderStatusBar}>
                  <button
                    className={ordersStyles.orderPrepareBtn}
                    onClick={() =>
                      onUpdateStatus(
                        delivery.id,
                        STATUS_STEPS[currentIndex + 1],
                      )
                    }
                  >
                    ✓ עדכן ל: {STATUS_LABELS[STATUS_STEPS[currentIndex + 1]]?.label}
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}