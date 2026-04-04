import { useEffect, useMemo, useState } from "react";
import modalStyles from "../../../styles/manager/ManagerModals.module.scss";
import formStyles from "../../../styles/manager/ManagerForms.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";

const SEASONS = ["קיץ", "חורף", "אביב/סתיו", "כל העונות"];

const SEASON_COLORS = {
  קיץ: { bg: "rgba(230,126,34,0.1)", color: "#e67e22", icon: "☀️" },
  חורף: { bg: "rgba(52,152,219,0.1)", color: "#3498db", icon: "❄️" },
  "אביב/סתיו": { bg: "rgba(46,204,113,0.1)", color: "#2ecc71", icon: "🌸" },
  "כל העונות": { bg: "rgba(155,89,182,0.1)", color: "#9b59b6", icon: "🌀" },
};

function deepCopyVariants(variants = []) {
  return variants.map((variant) => ({
    colorName: variant.colorName,
    colorHex: variant.colorHex,
    sizes: { ...(variant.sizes || {}) },
  }));
}

function calcVariantsTotal(variants = []) {
  return variants.reduce((sum, variant) => {
    return (
      sum +
      Object.values(variant.sizes || {}).reduce(
        (innerSum, qty) => innerSum + (parseInt(qty, 10) || 0),
        0
      )
    );
  }, 0);
}

export default function DetailsModal({
  isOpen,
  product,
  onClose,
  onSave,
  theme,
}) {
  const [price, setPrice] = useState(0);
  const [minStock, setMinStock] = useState(10);
  const [season, setSeason] = useState("");
  const [variantsDraft, setVariantsDraft] = useState([]);

  useEffect(() => {
    if (!product) return;
    setPrice(product.price || 0);
    setMinStock(product.minStock || 10);
    setSeason(product.season || "כל העונות");
    setVariantsDraft(deepCopyVariants(product.variants || []));
  }, [product]);

  const totalStock = useMemo(
    () => calcVariantsTotal(variantsDraft),
    [variantsDraft]
  );

  if (!isOpen || !product) return null;

  const seasonStyle = SEASON_COLORS[season] || {};

  const handleQtyChange = (variantIndex, sizeKey, value) => {
    const safeValue = Math.max(0, parseInt(value || "0", 10) || 0);
    setVariantsDraft((prev) =>
      prev.map((variant, index) =>
        index !== variantIndex
          ? variant
          : { ...variant, sizes: { ...variant.sizes, [sizeKey]: safeValue } }
      )
    );
  };

  const handleSave = () => {
    onSave({
      ...product,
      price: Number(price),
      minStock: Number(minStock),
      season,
      variants: variantsDraft,
      stock: totalStock,
    });
  };

  return (
    <div
      className={`${modalStyles.modalOverlay} ${
        theme === "light" ? modalStyles.light : ""
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={modalStyles.detailsModalBox}>
        <button className={modalStyles.modalCloseBtn} onClick={onClose}>
          ✕
        </button>

        <div className={modalStyles.detailsTopSection}>
          <div className={modalStyles.detailsTopRight}>
            <div className={modalStyles.detailsTitle}>
              פרטים — {product.name}
            </div>

            <div className={modalStyles.detailsMeta}>
              <span className={`${uiStyles.tag} ${uiStyles.tGold}`}>
                {product.code}
              </span>
              <span className={`${uiStyles.tag} ${uiStyles.tBlue}`}>
                {product.cat}
              </span>
              <span
                className={`${uiStyles.tag} ${
                  product.gender === "נשים"
                    ? uiStyles.tPurple
                    : uiStyles.tOrange
                }`}
              >
                {product.gender}
              </span>

              {season && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.28rem",
                    padding: "0.18rem 0.6rem",
                    borderRadius: "20px",
                    background: seasonStyle.bg,
                    color: seasonStyle.color,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  {seasonStyle.icon} {season}
                </span>
              )}

              <span className={`${uiStyles.tag} ${uiStyles.tGreen}`}>
                מלאי: {totalStock}
              </span>
              <span className={`${uiStyles.tag} ${uiStyles.tGold}`}>
                ₪{price}
              </span>
            </div>

            <div className={modalStyles.detailsName}>{product.name}</div>
            <div className={modalStyles.detailsDescription}>{product.desc}</div>
          </div>

          <img
            src={product.img}
            alt={product.name}
            className={modalStyles.detailsProductImage}
          />
        </div>

        <div className={modalStyles.detailsFieldsGrid}>
          <div className={formStyles.fg}>
            <div className={formStyles.fl}>מחיר (₪)</div>
            <input
              className={formStyles.fi}
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className={formStyles.fg}>
            <div className={formStyles.fl}>מינימום להתראה</div>
            <input
              className={formStyles.fi}
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
            />
          </div>

          <div className={formStyles.fg} style={{ gridColumn: "span 2" }}>
            <div className={formStyles.fl}>עונה</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {SEASONS.map((s) => {
                const sc = SEASON_COLORS[s];
                const isSelected = season === s;

                return (
                  <button
                    key={s}
                    onClick={() => setSeason(s)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.45rem 0.9rem",
                      borderRadius: "20px",
                      border: isSelected
                        ? `1.5px solid ${sc.color}`
                        : "1px solid var(--border)",
                      background: isSelected ? sc.bg : "transparent",
                      color: isSelected ? sc.color : "var(--muted)",
                      fontFamily: "Alef, sans-serif",
                      fontSize: "0.82rem",
                      fontWeight: isSelected ? 700 : 400,
                      cursor: "pointer",
                      transition: "all 0.18s",
                    }}
                    type="button"
                  >
                    {sc.icon} {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={modalStyles.detailsSectionRow}>
          <span className={modalStyles.detailsSectionLabel}>
            עריכת כמות לפי צבע/מידה
          </span>
        </div>

        <div className={modalStyles.detailsVariantsWrap}>
          {variantsDraft.map((variant, variantIndex) => {
            const sizesEntries = Object.entries(variant.sizes || {});
            const variantTotal = sizesEntries.reduce(
              (sum, [, qty]) => sum + (parseInt(qty, 10) || 0),
              0
            );

            return (
              <div
                key={`${variant.colorName}-${variantIndex}`}
                className={modalStyles.colorCard}
              >
                <div className={modalStyles.colorCardHead}>
                  <span className={`${uiStyles.tag} ${uiStyles.tGold}`}>
                    סה״כ: {variantTotal} יח׳
                  </span>

                  <div className={modalStyles.colorCardTitleWrap}>
                    <strong>{variant.colorName || "צבע"}</strong>
                    <span
                      className={modalStyles.dot}
                      style={{ background: variant.colorHex || "#999" }}
                    />
                  </div>
                </div>

                <div className={modalStyles.sizesGrid}>
                  {sizesEntries.map(([sizeKey, qty]) => (
                    <label key={sizeKey} className={modalStyles.sizePill}>
                      <strong>{sizeKey}</strong>
                      <span className={modalStyles.sizeSeparator}>•</span>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) =>
                          handleQtyChange(variantIndex, sizeKey, e.target.value)
                        }
                        className={modalStyles.sizeQtyInput}
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className={modalStyles.detailsFooter}>
          <button
            className={modalStyles.detailsSaveBtn}
            onClick={handleSave}
          >
            שמירה 💾
          </button>
        </div>
      </div>
    </div>
  );
}