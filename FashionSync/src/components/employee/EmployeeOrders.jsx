import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";
import overviewStyles from "../../styles/employee/EmployeeOverview.module.scss";
import ordersStyles from "../../styles/employee/EmployeeOrders.module.scss";

export default function EmployeeOrders({ orders, onToggleOrderReady }) {
  const pending = orders.filter((o) => o.status === "pending").length;
  const ready = orders.filter((o) => o.status === "ready").length;

  return (
    <div className={`${layoutStyles.panel} ${layoutStyles.active}`}>
      <div className={layoutStyles.pageHeader}>
        <div className={layoutStyles.pageTitle}>הזמנות לקוחות</div>
        <div className={layoutStyles.pageSub}>
          הזמנות שנפתחו — יש להכין ולסמן כמוכן
        </div>
      </div>

      <div
        className={layoutStyles.statsRow}
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        <div className={`${overviewStyles.statCard} ${overviewStyles.orange}`}>
          <div className={overviewStyles.statIcon}>⏳</div>
          <div className={overviewStyles.statLabel}>ממתינות</div>
          <div className={`${overviewStyles.statValue} ${overviewStyles.orangeText}`}>
            {pending}
          </div>
          <div className={overviewStyles.statSub}>לטיפול</div>
        </div>

        <div className={`${overviewStyles.statCard} ${overviewStyles.green}`}>
          <div className={overviewStyles.statIcon}>✅</div>
          <div className={overviewStyles.statLabel}>מוכנות</div>
          <div className={`${overviewStyles.statValue} ${overviewStyles.greenText}`}>
            {ready}
          </div>
          <div className={overviewStyles.statSub}>להגשה</div>
        </div>

        <div className={`${overviewStyles.statCard} ${overviewStyles.blue}`}>
          <div className={overviewStyles.statIcon}>📋</div>
          <div className={overviewStyles.statLabel}>סה"כ</div>
          <div className={`${overviewStyles.statValue} ${overviewStyles.blueText}`}>
            {orders.length}
          </div>
          <div className={overviewStyles.statSub}>הזמנות</div>
        </div>
      </div>

      {!orders.length ? (
        <div className={layoutStyles.emptyState}>
          <div className={layoutStyles.emptyIcon}>🎉</div>
          <div className={layoutStyles.emptyText}>אין הזמנות פתוחות</div>
        </div>
      ) : (
        orders.map((order) => {
          const total = order.items.reduce(
            (sum, item) => sum + item.price * item.qty,
            0
          );
          const isReady = order.status === "ready";

          return (
            <div className={ordersStyles.orderCard} key={order.id}>
              <div className={ordersStyles.orderHeader}>
                <div>
                  <div className={ordersStyles.orderCustomer}>
                    👤 {order.customer}
                  </div>
                  <div className={ordersStyles.orderId}>{order.id}</div>
                </div>

                <div>
                  <span
                    className={`${layoutStyles.badge} ${
                      isReady
                        ? layoutStyles.badgeGreen
                        : layoutStyles.badgeYellow
                    }`}
                  >
                    {isReady ? "✅ מוכן לאיסוף" : "⏳ ממתין להכנה"}
                  </span>
                </div>
              </div>

              <div className={ordersStyles.orderItemsList}>
                {order.items.map((item, index) => (
                  <div className={ordersStyles.orderItemRow} key={index}>
                    <img
                      className={ordersStyles.orderItemImg}
                      src={item.img}
                      alt={item.name}
                    />
                    <div className={ordersStyles.orderItemInfo}>
                      <div className={ordersStyles.orderItemName}>
                        {item.name}
                      </div>
                      <div className={ordersStyles.orderItemMeta}>
                        מידה: {item.size} · כמות: {item.qty} · ₪{item.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={ordersStyles.orderStatusBar}>
                <span className={ordersStyles.orderTotal}>
                  ₪{total.toLocaleString()}
                </span>

                <button
                  className={`${ordersStyles.orderPrepareBtn} ${
                    isReady ? ordersStyles.done : ""
                  }`}
                  onClick={() => onToggleOrderReady(order.id)}
                >
                  {isReady ? "✓ מוכן" : "הכן להגשה"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
