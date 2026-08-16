import { useLanguage } from "../../../translations/LanguageProvider";
import { useModalA11y } from "../../../hooks/useModalA11y";
import {
  getItemName,
  getItemColor,
  getItemSize,
} from "../../../functions/customer/itemDisplay";
import { formatDateTime } from "../../../functions/shared/dateFormat";

export default function ReceiptDetailsModal({ open, receipt, onClose }) {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.receiptDetailsModal;
  const { dialogRef, dialogProps, titleProps } = useModalA11y({
    isOpen: open,
    onClose: onClose,
  });
  const priceT = dict.customer.checkout.priceBox;
  // A receipt says when it cannot read a date, and prints the full year
  // rather than the two digits the list screens use.
  function fmtDate(value) {
    return formatDateTime(value, lang, { fullYear: true }) || t.unknown;
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
    cityEn: rawCustomer.cityEn || "",
    street: rawCustomer.street || "",
    streetEn: rawCustomer.streetEn || "",
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
        ref={dialogRef}
        {...dialogProps}
        style={{
          background: "var(--surface)",
          color: "var(--text)",
          padding: "28px",
          borderRadius: "18px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "85vh",
          overflowY: "auto",
          border: "1px solid var(--border-gold)",
          position: "relative",
          boxSizing: "border-box",
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
            <span {...titleProps}>{t.title}</span>
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
                {t.address} {[
                  (lang === "en" ? customer.streetEn : customer.street) || customer.street,
                  (lang === "en" ? customer.cityEn : customer.city) || customer.city,
                ].filter(Boolean).join(", ")}
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
              alt={getItemName(item, lang)}
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
                {getItemName(item, lang)}
              </div>
              <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                {[
                  getItemSize(item, lang),
                  getItemColor(item, lang),
                ].filter(Boolean).join(" · ")}
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