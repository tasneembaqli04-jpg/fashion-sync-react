export default function CustomerDetailsModal({ open, customer, email, onClose }) {
  if (!open) return null;

  const fullName =
    `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() ||
    customer?.name ||
    "לא הוזן";

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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#15151f",
          color: "white",
          padding: "28px",
          borderRadius: "18px",
          minWidth: "380px",
          border: "1px solid #d6b65c",
          direction: "rtl",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>👤 פרטי הלקוח</h2>

        <p>👤 שם מלא: {fullName}</p>
        <p>📞 טלפון: {customer?.phone || "לא הוזן"}</p>
        <p>✉️ מייל: {email || customer?.email || "לא הוזן"}</p>
        <p>🏙️ עיר: {customer?.city || "לא הוזן"}</p>
        <p>🏠 רחוב: {customer?.street || "לא הוזן"}</p>
        <p>📮 מיקוד: {customer?.zip || "לא הוזן"}</p>
        <p>📝 הערות: {customer?.notes || "אין הערות"}</p>

        <button
          type="button"
          onClick={onClose}
          style={{
          marginTop: "20px",
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: "none",
          background: "#d6b65c",
          color: "#111",
          fontWeight: "700",
          fontSize: "16px",
          cursor: "pointer",
          transition: "0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "#e8c96e")
       }   
       onMouseLeave={(e) =>
          (e.currentTarget.style.background = "#d6b65c")
        }
       >
         סגור
        </button>
      </div>
    </div>
  );
}