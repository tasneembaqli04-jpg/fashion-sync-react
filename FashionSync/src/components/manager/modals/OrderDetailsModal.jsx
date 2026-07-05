function fmtDate(value) {
  if (!value) return "לא ידוע";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "לא ידוע";
  return d.toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAY_METHOD_LABELS = {
  card: "כרטיס אשראי",
  cash: "מזומן",
  bit: "Bit",
  paypal: "PayPal",
  giftcard: "כרטיס מתנה",
};

export default function OrderDetailsModal({ open, order, onClose }) {
  if (!open || !order) return null;

  const customer = order.customerDetails || {};
  const fullName =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    customer.name ||
    "לא הוזן";

  const items = Array.isArray(order.items) ? order.items : [];
  const isReady = order.status === "ready";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          color: "var(--text)",
          padding: "28px",
          borderRadius: "18px",
          minWidth: "380px",
          maxWidth: "480px",
          maxHeight: "85vh",
          overflowY: "auto",
          border: "1px solid var(--border-gold)",
          direction: "rtl",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: "4px" }}>📋 פרטי הזמנה</h2>
        <p style={{ opacity: 0.7, marginTop: 0 }}>{order.id}</p>

        <p>
          🚦 סטטוס:{" "}
          <strong style={{ color: isReady ? "#4caf50" : "#d6b65c" }}>
            {isReady ? "מוכן להגשה" : "ממתין להכנה"}
          </strong>
        </p>
        <p>🕒 תאריך: {fmtDate(order.date)}</p>

        <hr style={{ borderColor: "var(--border)", margin: "16px 0" }} />

        <h3 style={{ marginBottom: "8px" }}>👤 פרטי לקוח</h3>
        <p>שם מלא: {fullName}</p>
        <p>📞 טלפון: {customer.phone || "לא הוזן"}</p>
        <p>✉️ מייל: {order.customerEmail || customer.email || "לא הוזן"}</p>
        <p>🏙️ עיר: {customer.city || "לא הוזן"}</p>
        <p>🏠 רחוב: {customer.street || "לא הוזן"}</p>
        <p>📮 מיקוד: {customer.zip || "לא הוזן"}</p>
        {customer.notes && <p>📝 הערות: {customer.notes}</p>}

        <hr style={{ borderColor: "var(--border)", margin: "16px 0" }} />

        <h3 style={{ marginBottom: "8px" }}>🛍️ פריטים</h3>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <img
              src={item.img}
              alt={item.name}
              style={{
                width: "48px",
                height: "48px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <div>
              <div>{item.name}</div>
              <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                מידה: {item.size} · כמות: {item.qty} · ₪{item.price}
              </div>
            </div>
          </div>
        ))}

        <hr style={{ borderColor: "var(--border)", margin: "16px 0" }} />

        <h3 style={{ marginBottom: "8px" }}>🚚 משלוח ותשלום</h3>
        <p>שיטת משלוח: {order.shipping?.label || "לא ידוע"}</p>
        <p>אמצעי תשלום: {PAY_METHOD_LABELS[order.payMethod] || "לא ידוע"}</p>

        <p style={{ fontSize: "1.2rem", marginTop: "12px" }}>
          💰 סה"כ לתשלום: <strong>₪{Number(order.total || 0).toLocaleString()}</strong>
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            background: "#d6b65c",
            color: "#111",
            fontWeight: "700",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          סגור
        </button>
      </div>
    </div>
  );
}