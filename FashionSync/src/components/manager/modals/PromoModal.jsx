import { createPortal } from "react-dom";

export default function PromoModal({
  open,
  onClose,
  product,
  onConfirm,
  onCancelPromote,
  isCurrentlyPromoted,
}) {
  if (!open || !product) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface2, #161820)",
          border: "1px solid rgba(255,107,53,0.3)",
          borderRadius: "18px",
          padding: "1.7rem",
          width: "480px",
          maxWidth: "96vw",
          position: "relative",
          direction: "rtl",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            background: "none",
            border: "none",
            color: "var(--muted, #5c6170)",
            fontSize: "1.25rem",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.2rem",
            color: "#ff6b35",
            marginBottom: "0.95rem",
          }}
        >
          📢 הפעלת פרסומת למוצר
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.9rem",
            alignItems: "center",
            marginBottom: "0.95rem",
            background: "rgba(255,107,53,0.06)",
            border: "1px solid rgba(255,107,53,0.2)",
            borderRadius: "12px",
            padding: "0.95rem",
          }}
        >
          <img
            src={product.img}
            alt={product.name}
            style={{
              width: "62px",
              height: "62px",
              objectFit: "cover",
              borderRadius: "10px",
              border: "2px solid rgba(255,107,53,0.3)",
              flexShrink: 0,
            }}
          />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800, fontSize: "0.98rem" }}>
              {product.name}
            </div>
            <div
              style={{
                color: "var(--muted, #5c6170)",
                fontSize: "0.8rem",
                marginTop: "0.18rem",
              }}
            >
              {product.cat} · ₪{product.price}
            </div>
            <div
              style={{
                color: "#ff6b35",
                fontSize: "0.76rem",
                marginTop: "0.18rem",
              }}
            >
              🛒 {product.salesLastMonth || 0} מכירות בחודש
            </div>
          </div>
        </div>

        {isCurrentlyPromoted && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(46,204,113,0.08)",
              border: "1px solid rgba(46,204,113,0.25)",
              borderRadius: "10px",
              padding: "0.6rem 0.9rem",
              color: "#2ecc71",
              fontSize: "0.84rem",
              marginBottom: "0.75rem",
            }}
          >
            ✅ פרסומת פעילה כרגע
          </div>
        )}

        {isCurrentlyPromoted && (
          <button
            onClick={() => {
              onCancelPromote && onCancelPromote();
              onClose();
            }}
            style={{
              width: "100%",
              padding: "0.72rem",
              background: "rgba(231,76,60,0.08)",
              border: "1px solid rgba(231,76,60,0.25)",
              borderRadius: "10px",
              color: "#f1948a",
              fontFamily: "Alef, sans-serif",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              marginBottom: "0.65rem",
            }}
          >
            ❌ בטל פרסומת
          </button>
        )}

        <div style={{ display: "flex", gap: "0.7rem", marginTop: "1.1rem" }}>
          <button
            onClick={() => onConfirm(product)}
            style={{
              flex: 1,
              padding: "0.82rem",
              background: isCurrentlyPromoted
                ? "linear-gradient(135deg, #2ecc71, #27ae60)"
                : "linear-gradient(135deg, #c9a84c, #e8c97a)",
              border: "none",
              borderRadius: "10px",
              color: isCurrentlyPromoted ? "#ffffff" : "#07080c",
              fontFamily: "Alef, sans-serif",
              fontWeight: 700,
              fontSize: "0.98rem",
              cursor: "pointer",
            }}
          >
            🚀 הפעל פרסומת
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "0.82rem 1.2rem",
              background: "transparent",
              border: "1px solid var(--border, rgba(255,255,255,0.06))",
              borderRadius: "10px",
              color: "var(--muted, #5c6170)",
              fontFamily: "Alef, sans-serif",
              cursor: "pointer",
            }}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
