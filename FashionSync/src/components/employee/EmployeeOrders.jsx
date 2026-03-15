export default function EmployeeOrders({ orders, onToggleOrderReady }) {
  const pending = orders.filter((o) => o.status === "pending").length;
  const ready = orders.filter((o) => o.status === "ready").length;

  return (
    <div className="panel active">
      <div className="page-header">
        <div className="page-title">הזמנות לקוחות</div>
        <div className="page-sub">הזמנות שנפתחו — יש להכין ולסמן כמוכן</div>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">ממתינות</div>
          <div className="stat-value orange">{pending}</div>
          <div className="stat-sub">לטיפול</div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-label">מוכנות</div>
          <div className="stat-value green">{ready}</div>
          <div className="stat-sub">להגשה</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">📋</div>
          <div className="stat-label">סה"כ</div>
          <div className="stat-value blue">{orders.length}</div>
          <div className="stat-sub">הזמנות</div>
        </div>
      </div>

      {!orders.length ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <div className="empty-text">אין הזמנות פתוחות</div>
        </div>
      ) : (
        orders.map((order) => {
          const total = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
          const isReady = order.status === "ready";

          return (
            <div className="order-card" key={order.id}>
              <div className="order-header">
                <div>
                  <div className="order-customer">👤 {order.customer}</div>
                  <div className="order-id">{order.id}</div>
                </div>

                <div>
                  <span className={`badge ${isReady ? "badge-green" : "badge-yellow"}`}>
                    {isReady ? "✅ מוכן לאיסוף" : "⏳ ממתין להכנה"}
                  </span>
                </div>
              </div>

              <div className="order-items-list">
                {order.items.map((item, index) => (
                  <div className="order-item-row" key={index}>
                    <img className="order-item-img" src={item.img} alt={item.name} />
                    <div className="order-item-info">
                      <div className="order-item-name">{item.name}</div>
                      <div className="order-item-meta">
                        מידה: {item.size} · כמות: {item.qty} · ₪{item.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-status-bar">
                <span className="order-total">₪{total.toLocaleString()}</span>

                <button
                  className={`order-prepare-btn ${isReady ? "done" : ""}`}
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
