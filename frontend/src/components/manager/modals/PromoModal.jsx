import { createPortal } from "react-dom";
import modalStyles from "../../../styles/manager/ManagerModals.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import { useLanguage } from "../../../translations/LanguageProvider";

export default function PromoModal({
  open,
  onClose,
  product,
  onConfirm,
  onCancelPromote,
  isCurrentlyPromoted,
}) {
  const { t: dict } = useLanguage();
  const t = dict.manager.promoModal;

  if (!open || !product) return null;

  return createPortal(
    <div
      className={modalStyles.modalOverlay}
      onClick={onClose}
    >
      <div
        className={modalStyles.promoModalBox}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={modalStyles.modalClose}
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
          {t.title}
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

          <div>
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
              {dict.categoryLabels[product.cat] || product.cat} · ₪{product.price}
            </div>

            <div
              style={{
                color: "#ff6b35",
                fontSize: "0.76rem",
                marginTop: "0.18rem",
              }}
            >
              🛒 {product.salesLastMonth || 0} {t.salesThisMonth}
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
            {t.currentlyActive}
          </div>
        )}

        {isCurrentlyPromoted && (
          <button
            onClick={() => {
              onCancelPromote && onCancelPromote();
              onClose();
            }}
            className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
            style={{
              width: "100%",
              background: "rgba(231,76,60,0.08)",
              border: "1px solid rgba(231,76,60,0.25)",
              color: "#f1948a",
              marginBottom: "0.65rem",
            }}
          >
            {t.cancelPromo}
          </button>
        )}

        <div style={{ display: "flex", gap: "0.7rem", marginTop: "1.1rem" }}>
          <button
            onClick={() => onConfirm(product)}
            className={`${uiStyles.btn} ${uiStyles.btnGold}`}
            style={{
              flex: 1,
              background: isCurrentlyPromoted
                ? "linear-gradient(135deg, #2ecc71, #27ae60)"
                : undefined,
              color: isCurrentlyPromoted ? "#ffffff" : undefined,
            }}
          >
            {t.activateButton}
          </button>

          <button
            onClick={onClose}
            className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
          >
            {t.cancelButton}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}