import { useLanguage } from "../../../translations/LanguageProvider";
import { useModalA11y } from "../../../hooks/useModalA11y";
import {
  getItemName,
  getItemSize,
} from "../../../functions/customer/itemDisplay";

export default function OrderDetailsModal({ open, order, onClose }) {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.orderDetailsModal;
  const { dialogRef, dialogProps, titleProps } = useModalA11y({
    isOpen: open,
    onClose: onClose,
  });
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

  const SHIPPING_NAME_KEYS = {
    standard: t.shippingNameStandard,
    express: t.shippingNameExpress,
    same_day: t.shippingNameSameDay,
    pickup: t.shippingNamePickup,
  };

  const SHIPPING_LABEL_FALLBACK = {
    "משלוח רגיל": t.shippingNameStandard,
    "משלוח מהיר": t.shippingNameExpress,
    "משלוח באותו יום": t.shippingNameSameDay,
    "איסוף עצמי": t.shippingNamePickup,
  };

  function getShippingMethodLabel(shipping) {
    if (!shipping) return t.unknown;

    if (SHIPPING_NAME_KEYS[shipping.id]) {
      return SHIPPING_NAME_KEYS[shipping.id];
    }

    const cleanedLabel = String(shipping.label || "")
      .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
      .trim();

    if (!cleanedLabel) return t.unknown;

    if (SHIPPING_LABEL_FALLBACK[cleanedLabel]) {
      return SHIPPING_LABEL_FALLBACK[cleanedLabel];
    }

    const partialMatchKey = Object.keys(SHIPPING_LABEL_FALLBACK).find(
      (key) => cleanedLabel.includes(key) || key.includes(cleanedLabel),
    );

    if (partialMatchKey) {
      return SHIPPING_LABEL_FALLBACK[partialMatchKey];
    }

    return cleanedLabel;
  }

  if (!open || !order) return null;

  const embedded = order.customerEmbedded || {};
  const profile = order.customerDetails || {};
  const customer = {
    firstName: profile.firstName || embedded.firstName || "",
    lastName: profile.lastName || embedded.lastName || "",
    name: profile.name || embedded.name || "",
    nameEn: profile.nameEn || embedded.nameEn || "",
    phone: profile.phone || embedded.phone || "",
    email: profile.email || embedded.email || "",
    city: profile.city || embedded.city || "",
    cityEn: profile.cityEn || embedded.cityEn || "",
    street: profile.street || embedded.street || "",
    streetEn: profile.streetEn || embedded.streetEn || "",
    zip: profile.zip || embedded.zip || "",
    notes: profile.notes || embedded.notes || "",
  };
  const fullName =
    (lang === "en" && customer.nameEn) ||
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
          maxWidth: "480px",
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

        <h2 style={{ marginBottom: "4px" }}><span {...titleProps}>{t.title}</span></h2>
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
        <p>{t.city} {(lang === "en" ? customer.cityEn : customer.city) || customer.city || t.notEntered}</p>
        <p>{t.street} {(lang === "en" ? customer.streetEn : customer.street) || customer.street || t.notEntered}</p>
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
              alt={getItemName(item, lang)}
              style={{
                width: "48px",
                height: "48px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <div>
              <div>
                {getItemName(item, lang)}
              </div>
              <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                {t.sizeLabel} {getItemSize(item, lang)} · {t.qtyLabel} {item.qty} · ₪{item.price}
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
        <p>{t.shippingMethod} {getShippingMethodLabel(order.shipping)}</p>
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
      </div>
    </div>
  );
}