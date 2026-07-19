import { useLanguage } from "../../../translations/LanguageProvider";

export default function OrderDetailsModal({ open, order, onClose }) {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.orderDetailsModal;
  const locale = lang === "en" ? "en-US" : "he-IL";

  function fmtDate(value) {
    if (!value) return t.unknown;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return t.unknown;
    return d.toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const PAY_METHOD_LABELS = {
    card: t.payCard,
    cash: t.payCash,
    bit: "Bit",
    paypal: "PayPal",
    giftcard: t.payGiftCard,
  };

  if (!open || !order) return null;

  const customer = order.customerDetails || {};
  const fullName =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    customer.name ||
    t.notEntered;

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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: "4px" }}>{t.title}</h2>
        <p style={{ opacity: 0.7, marginTop: 0 }}>{order.id}</p>

        <p>
          {t.statusLabel}{" "}
          <strong style={{ color: isReady ? "#4caf50" : "#d6b65c" }}>
            {isReady ? t.statusReady : t.statusPending}
          </strong>
        </p>
        <p>{t.dateLabel} {fmtDate(order.date)}</p>

        <hr style={{ borderColor: "var(--border)", margin: "16px 0" }} />

        <h3 style={{ marginBottom: "8px" }}>{t.customerDetailsTitle}</h3>
        <p>{t.fullName} {fullName}</p>
        <p>{t.phone} {customer.phone || t.notEntered}</p>
        <p>{t.email} {order.customerEmail || customer.email || t.notEntered}</p>
        <p>{t.city} {customer.city || t.notEntered}</p>
        <p>{t.street} {customer.street || t.notEntered}</p>
        <p>{t.zip} {customer.zip || t.notEntered}</p>
        {customer.notes && <p>{t.notes} {customer.notes}</p>}

        <hr style={{ borderColor: "var(--border)", margin: "16px 0" }} />

        <h3 style={{ marginBottom: "8px" }}>{t.itemsTitle}</h3>
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
                {t.sizeLabel} {item.size} · {t.qtyLabel} {item.qty} · ₪{item.price}
              </div>
              {item.isCustomSize && (
                <div
                  style={{
                    marginTop: "0.3rem",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "8px",
                    background: "rgba(230,126,34,0.12)",
                    border: "1px solid #e67e22",
                    color: "#e67e22",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    display: "inline-block",
                  }}
                >
                  {t.customSizeWarning.replace("{size}", item.size)}
                </div>
              )}
            </div>
          </div>
        ))}

        <hr style={{ borderColor: "var(--border)", margin: "16px 0" }} />

        <h3 style={{ marginBottom: "8px" }}>{t.shippingPaymentTitle}</h3>
        <p>{t.shippingMethod} {order.shipping?.label || t.unknown}</p>
        <p>{t.paymentMethod} {PAY_METHOD_LABELS[order.payMethod] || t.unknown}</p>
        {order.payMethod === "card" && Number(order.installments) > 1 && (
          <p>{t.installmentsCount} {order.installments}</p>
        )}
        {Number(order.discountPct) > 0 && (
          <p>
            {t.discount} {order.discountPct}% (−₪
            {Number(order.discountAmount || 0).toLocaleString()})
          </p>
        )}
        {Number(order.pointsRedeemed) > 0 && (
          <p>
            {t.pointsRedeemed
              .replace("{points}", Number(order.pointsRedeemed).toLocaleString())
              .replace("{amount}", Number(order.pointsDiscountAmount || 0).toFixed(2))}
          </p>
        )}

        <p style={{ fontSize: "1.2rem", marginTop: "12px" }}>
          {t.totalToPayLabel} <strong>₪{Number(order.total || 0).toLocaleString()}</strong>
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
          {t.close}
        </button>
      </div>
    </div>
  );
}