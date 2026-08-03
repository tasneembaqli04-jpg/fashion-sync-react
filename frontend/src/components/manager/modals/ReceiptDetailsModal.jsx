import { useLanguage } from "../../../translations/LanguageProvider";

export default function ReceiptDetailsModal({ open, receipt, onClose }) {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.receiptDetailsModal;
  const priceT = dict.customer.checkout.priceBox;
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

  if (!open || !receipt) return null;

  const items = Array.isArray(receipt.items) ? receipt.items : [];
  const rawCustomer = receipt.customer || {};
  const customer = {
    firstName: rawCustomer.firstName || "",
    lastName: rawCustomer.lastName || "",
    name: rawCustomer.name || "",
    nameEn: rawCustomer.nameEn || "",
    phone: rawCustomer.phone || "",
    email: rawCustomer.email || "",
    city: rawCustomer.city || "",
    street: rawCustomer.street || "",
  };
  const fullName =
    (lang === "en" && customer.nameEn) ||
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    customer.name ||
    "";

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
    >
      <div
        style={{
          background: "var(--surface)",
          color: "var(--text)",
          padding: "28px",
          borderRadius: "18px",
          minWidth: "380px",
          maxWidth: "520px",
          maxHeight: "85vh",
          overflowY: "auto",
          border: "1px solid var(--border-gold)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label={t.close}
          style={{
            position: "absolute",
            top: "0.6rem",
            left: "0.6rem",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: "1.3rem",
            cursor: "pointer",
            borderRadius: "50%",
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>🧾</div>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "var(--gold)" }}>
            {t.title}
          </h2>
          <div style={{ opacity: 0.75, marginTop: "0.3rem" }}>{receipt.id}</div>
          <div style={{ opacity: 0.6, fontSize: "0.85rem" }}>{fmtDate(receipt.date)}</div>
        </div>

        {(fullName || customer.email || customer.phone) && (
          <>
            <hr style={{ borderColor: "var(--border)", margin: "16px 0" }} />
            <h3 style={{ marginBottom: "8px" }}>{t.customerDetailsTitle}</h3>
            {fullName && <p style={{ margin: "4px 0" }}>{t.fullName} {fullName}</p>}
            {(receipt.customerEmail || customer.email) && (
              <p style={{ margin: "4px 0" }}>{t.email} {receipt.customerEmail || customer.email}</p>
            )}
            {customer.phone && <p style={{ margin: "4px 0" }}>{t.phone} {customer.phone}</p>}
            {(customer.city || customer.street) && (
              <p style={{ margin: "4px 0" }}>
                {t.address} {[customer.street, customer.city].filter(Boolean).join(", ")}
              </p>
            )}
          </>
        )}

        <hr style={{ borderColor: "var(--border)", margin: "16px 0" }} />

        <h3 style={{ marginBottom: "8px" }}>{t.itemsTitle}</h3>

        {items.map((item, index) => (
          <div
            key={`${item.code}-${index}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
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
                border: "1px solid var(--border)",
              }}
            />

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>
                {lang === "en" && item.nameEn ? item.nameEn : item.name}
              </div>
              <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                {[item.size, item.color].filter(Boolean).join(" · ")}
                {item.size || item.color ? " · " : ""}
                {t.qtyLabel} {item.qty}
              </div>
            </div>

            <div style={{ color: "var(--gold)", fontWeight: 700 }}>
              ₪{(item.price * item.qty).toLocaleString()}
            </div>
          </div>
        ))}

        <hr style={{ borderColor: "var(--border)", margin: "16px 0" }} />

        {receipt.subtotal > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
            <span>{priceT.subtotal}</span>
            <span>₪{receipt.subtotal.toLocaleString()}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
          <span>{priceT.shipping}</span>
          <span>{receipt.shippingCost === 0 ? priceT.freeShipping : `₪${receipt.shippingCost}`}</span>
        </div>

        {receipt.discountAmount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0", color: "var(--gold)" }}>
            <span>{priceT.discount}</span>
            <span>−₪{receipt.discountAmount.toLocaleString()}</span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 800,
            fontSize: "1.1rem",
            marginTop: "10px",
            paddingTop: "10px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <span>{t.totalLabel}</span>
          <span style={{ color: "var(--gold)" }}>₪{receipt.total.toLocaleString()}</span>
        </div>

        {receipt.payMethod && (
          <p style={{ marginTop: "12px", opacity: 0.75 }}>
            {t.paymentMethod} {PAY_METHOD_LABELS[receipt.payMethod] || receipt.payMethod}
          </p>
        )}

        </div>
    </div>
  );
}