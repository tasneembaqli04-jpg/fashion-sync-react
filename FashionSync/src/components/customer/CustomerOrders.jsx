import commonStyles from "../../styles/customer/Customer.module.scss";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";

export default function CustomerOrders({ show, orders = [] }) {
  if (!show) return null;

  const allOrders = orders;

  return (
    <div>
      <div className={commonStyles.pageTitle}>📦 ההזמנות שלי</div>
      <div className={commonStyles.pageSub}>מעקב אחרי הזמנות ומשלוחים</div>

      {allOrders.length ? (
        allOrders.map((order) => {
          const steps = Array.isArray(order.steps) && order.steps.length
            ? order.steps
            : ["אושרה", "בהכנה", "נשלחה", "נמסרה"];
          const status = Number(order.status) || 0;

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
          אין הזמנות עדיין
        </div>
      )}
    </div>
  );
}