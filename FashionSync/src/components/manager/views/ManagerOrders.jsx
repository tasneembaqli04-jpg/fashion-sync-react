import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";
import ordersStyles from "../../../styles/manager/ManagerOrders.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";

export default function ManagerOrders({ orders = [], onToggleOrderReady }) {
  const pending = orders.filter(
    (o) => o.status === "pending" || o.status === "waiting" || !o.status
  ).length;

  const ready = orders.filter(
    (o) => o.status === "ready" || o.status === "done" || o.status === "completed"
  ).length;

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
        <div className={`${overviewStyles.stat} ${overviewStyles.gold}`}>
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

        <div className={`${overviewStyles.stat} ${overviewStyles.green}`}>
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

        <div className={`${overviewStyles.stat} ${overviewStyles.blue}`}>
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
      </div>

      {!orders.length ? (
        <div className={ordersStyles.emptyState}>
          <div className={ordersStyles.emptyIcon}>🎉</div>
          <div className={ordersStyles.emptyText}>אין הזמנות פתוחות</div>
        </div>
      ) : (
        orders.map((order) => {
          const items = Array.isArray(order.items) ? order.items : [];

          const total = items.reduce(
            (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
            0
          );

          const isReady =
            order.status === "ready" ||
            order.status === "done" ||
            order.status === "completed";

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
                    className={`${uiStyles.tag} ${
                      isReady ? uiStyles.tGreen : uiStyles.tYellow
                    }`}
                  >
                    {isReady ? "✅ מוכן להגשה" : "⏳ ממתין להכנה"}
                  </span>
                </div>
              </div>

              <div className={ordersStyles.orderItemsList}>
                {items.map((item, index) => (
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
    </div>
  );
}