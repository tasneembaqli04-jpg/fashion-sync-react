import commonStyles from "../../styles/customer/Customer.module.scss";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";

const DEMO_ORDERS = [
  {
    id: "ORD-DEMO-001",
    date: "15/03/2025",
    items: [
      { name: "שמלת קיץ פרחונית", qty: 1 },
      { name: "חולצת טי בייסיק", qty: 2 },
    ],
    total: 477,
    status: 1,
    steps: ["אושרה", "בהכנה", "נשלחה", "נמסרה"],
  },
  {
    id: "ORD-DEMO-002",
    date: "08/03/2025",
    items: [
      { name: "ג'ינס סלים פיט", qty: 1 },
    ],
    total: 349,
    status: 3,
    steps: ["אושרה", "בהכנה", "נשלחה", "נמסרה"],
  },
];

export default function CustomerOrders({ show, orders = [] }) {
  if (!show) return null;

  const allOrders = [...DEMO_ORDERS, ...orders];

  return (
    <div>
      <div className={commonStyles.pageTitle}>📦 ההזמנות שלי</div>
      <div className={commonStyles.pageSub}>מעקב אחרי הזמנות ומשלוחים</div>

      {allOrders.length ? (
        allOrders.map((order) => {
          const percent = Math.round(
            (order.status / (order.steps.length - 1)) * 100
          );

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

              <div className={modalStyles.progressBar}>
                <div
                  className={modalStyles.progressFill}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className={modalStyles.progressSteps}>
                {order.steps.map((step, index) => (
                  <span
                    key={index}
                    className={index <= order.status ? modalStyles.done : ""}
                  >
                    {step}
                  </span>
                ))}
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