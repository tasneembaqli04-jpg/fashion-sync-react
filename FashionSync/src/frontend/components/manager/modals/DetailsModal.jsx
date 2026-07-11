import { useEffect, useMemo, useState } from "react";
import modalStyles from "../../../styles/manager/ManagerModals.module.scss";
import formStyles from "../../../styles/manager/ManagerForms.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";

const SEASONS = [
  { value: "summer", label: "קיץ" },
  { value: "winter", label: "חורף" },
  { value: "spring-autumn", label: "אביב/סתיו" },
  { value: "all", label: "כל השנה" },
];

const CATEGORY_SIZE_OPTIONS = {
  חולצות: ["S", "M", "L", "XL"],
  מכנסיים: ["28", "30", "32", "34"],
  שמלות: ["S", "M", "L", "XL"],
  עליוניות: ["S", "M", "L", "XL"],
  נעליים: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  אביזרים: ["אחיד"],
};
const MAX_STOCK = 99999;
const MAX_PRICE = 999999;

function clampNumberString(value, max) {
  const num = parseInt(value, 10);
  if (Number.isNaN(num)) return "";
  return String(Math.max(0, Math.min(num, max)));
}

const SEASON_COLORS = {
  summer: { bg: "rgba(230,126,34,0.1)", color: "#e67e22", icon: "☀️" },
  winter: { bg: "rgba(52,152,219,0.1)", color: "#3498db", icon: "❄️" },
  "spring-autumn": { bg: "rgba(46,204,113,0.1)", color: "#2ecc71", icon: "🌸" },
  all: { bg: "rgba(155,89,182,0.1)", color: "#9b59b6", icon: "🌀" },
};

function deepCopyVariants(variants = []) {
  return variants.map((variant) => ({
    colorName: variant.colorName,
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
  const [cost, setCost] = useState(0);
  const [isOnSale, setIsOnSale] = useState(false);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [isTrending, setIsTrending] = useState(false);
  const [minStock, setMinStock] = useState(10);
  const [season, setSeason] = useState("");
  const [variantsDraft, setVariantsDraft] = useState([]);
  const [simpleStock, setSimpleStock] = useState(0);
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (!product) return;
    setPrice(product.price || 0);
    setCost(product.cost || 0);
    setIsOnSale(Boolean(product.sale));
    setOriginalPrice(product.originalPrice || product.price || 0);
    setIsTrending(Boolean(product.trending));
    setMinStock(product.minStock || 10);
    setSeason(product.season || "all");
    setVariantsDraft(deepCopyVariants(product.variants || []));
    setSimpleStock(product.stock || 0);
    setDesc(product.desc || "");
  }, [product]);

  const totalStock = useMemo(
    () => calcVariantsTotal(variantsDraft),
    [variantsDraft]
  );

  const usesVariants = variantsDraft.length > 0;
  const displayedStock = usesVariants ? totalStock : simpleStock;

  if (!isOpen || !product) return null;

  const seasonStyle = SEASON_COLORS[season] || {};

  const handleQtyChange = (variantIndex, sizeKey, value) => {
    const safeValue = Math.max(0, Math.min(parseInt(value || "0", 10) || 0, MAX_STOCK));
    setVariantsDraft((prev) =>
      prev.map((variant, index) =>
        index !== variantIndex
          ? variant
          : { ...variant, sizes: { ...variant.sizes, [sizeKey]: safeValue } }
      )
    );
  };

  const handleColorNameChange = (variantIndex, value) => {
    setVariantsDraft((prev) =>
      prev.map((variant, index) =>
        index !== variantIndex ? variant : { ...variant, colorName: value }
      )
    );
  };

  const addColorVariant = () => {
    const sizeKeys = CATEGORY_SIZE_OPTIONS[product.cat] || ["S", "M", "L"];
    const sizes = {};
    sizeKeys.forEach((key) => {
      sizes[key] = 0;
    });

    setVariantsDraft((prev) => [
      ...prev,
      { colorName: "", sizes },
    ]);
  };

  const removeColorVariant = (variantIndex) => {
    setVariantsDraft((prev) => prev.filter((_, index) => index !== variantIndex));
  };

  const handleSave = () => {
    const cleanedVariants = variantsDraft.filter(
      (variant) => (variant.colorName || "").trim() !== ""
    );

    const colorNamesLower = cleanedVariants.map((v) =>
      v.colorName.trim().toLowerCase()
    );
    const hasDuplicateColor =
      new Set(colorNamesLower).size !== colorNamesLower.length;

    if (hasDuplicateColor) {
      alert("יש כאן שני צבעים עם אותו שם — כל צבע צריך שם ייחודי למוצר.");
      return;
    }

    const cleanedUsesVariants = cleanedVariants.length > 0;
    const cleanedTotal = calcVariantsTotal(cleanedVariants);

    onSave({
      ...product,
      price: Number(price),
      cost: Number(cost) || 0,
      sale: isOnSale,
      originalPrice: isOnSale ? Number(originalPrice) || 0 : null,
      trending: isTrending,
      minStock: Number(minStock),
      season,
      desc: desc.trim(),
      variants: cleanedVariants,
      stock: cleanedUsesVariants ? cleanedTotal : Number(simpleStock),
    });
  };

  return (
    <div
      className={`${modalStyles.modalOverlay} ${
        theme === "light" ? modalStyles.light : ""
      }`}
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
                  {seasonStyle.icon} {SEASONS.find((s) => s.value === season)?.label || season}
                </span>
              )}

              <span className={`${uiStyles.tag} ${uiStyles.tGreen}`}>
                מלאי: {displayedStock}
              </span>
              <span className={`${uiStyles.tag} ${uiStyles.tGold}`}>
                ₪{price}
              </span>
            </div>

            <div className={modalStyles.detailsName}>{product.name}</div>
            <div className={formStyles.fg} style={{ marginTop: "0.5rem" }}>
              <label>תיאור המוצר</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  resize: "vertical",
                  fontFamily: "Alef, sans-serif",
                }}
              />
            </div>
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
              max={MAX_PRICE}
              value={price}
              onChange={(e) => setPrice(clampNumberString(e.target.value, MAX_PRICE))}
            />
          </div>
          <div className={formStyles.fg}>
            <div className={formStyles.fl}>עלות מוצר (₪)</div>
            <input
              className={formStyles.fi}
              type="number"
              min="0"
              max={MAX_PRICE}
              value={cost}
              onChange={(e) => setCost(clampNumberString(e.target.value, MAX_PRICE))}
            />
          </div>

          <div className={formStyles.fg} style={{ gridColumn: "span 2" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={isOnSale}
                onChange={(e) => setIsOnSale(e.target.checked)}
              />
              🏷️ מוצר במבצע
            </label>

            {isOnSale && (
              <div style={{ marginTop: "0.5rem" }}>
                <div className={formStyles.fl}>מחיר מקורי (לפני ההנחה, ₪)</div>
                <input
                  className={formStyles.fi}
                  type="number"
                  min="0"
                  max={MAX_PRICE}
                  value={originalPrice}
                  onChange={(e) =>
                    setOriginalPrice(clampNumberString(e.target.value, MAX_PRICE))
                  }
                />
              </div>
            )}

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.7rem",
              }}
            >
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
              />
              🔥 מוצר טרנדי
            </label>
          </div>

          <div className={formStyles.fg}>
            <div className={formStyles.fl}>מינימום להתראה</div>
            <input
              className={formStyles.fi}
              type="number"
              min="0"
              max={MAX_STOCK}
              value={minStock}
              onChange={(e) => setMinStock(clampNumberString(e.target.value, MAX_STOCK))}
            />
          </div>

          <div className={formStyles.fg} style={{ gridColumn: "span 2" }}>
            <div className={formStyles.fl}>עונה</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {SEASONS.map(({ value, label }) => {
                const sc = SEASON_COLORS[value];
                const isSelected = season === value;

                return (
                  <button
                    key={value}
                    onClick={() => setSeason(value)}
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
                    {sc.icon} {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {!usesVariants && (
          <div className={formStyles.fg} style={{ marginBottom: "1rem" }}>
            <label>מלאי כללי</label>
            <input
              type="number"
              min="0"
              max={MAX_STOCK}
              value={simpleStock}
              onChange={(e) =>
                setSimpleStock(
                  Math.max(0, Math.min(parseInt(e.target.value || "0", 10) || 0, MAX_STOCK))
                )
              }
            />
          </div>
        )}

        <div className={modalStyles.detailsSectionRow}>
          <span className={modalStyles.detailsSectionLabel}>
            עריכת כמות לפי צבע/מידה (אופציונלי)
          </span>
        </div>

        <div className={modalStyles.detailsVariantsWrap}>
          {variantsDraft.map((variant, variantIndex) => {
            const canonicalOrder =
              CATEGORY_SIZE_OPTIONS[product.cat] || ["S", "M", "L"];
            const sizesEntries = Object.entries(variant.sizes || {}).sort(
              ([sizeA], [sizeB]) =>
                canonicalOrder.indexOf(sizeA) - canonicalOrder.indexOf(sizeB)
            );
            const variantTotal = sizesEntries.reduce(
              (sum, [, qty]) => sum + (parseInt(qty, 10) || 0),
              0
            );

            return (
              <div
                key={variantIndex}
                className={modalStyles.colorCard}
              >
                <div className={modalStyles.colorCardHead}>
                  <span className={`${uiStyles.tag} ${uiStyles.tGold}`}>
                    סה״כ: {variantTotal} יח׳
                  </span>

                  <div className={modalStyles.colorCardTitleWrap}>
                    <input
                      type="text"
                      placeholder="שם הצבע"
                      value={variant.colorName || ""}
                      onChange={(e) =>
                        handleColorNameChange(variantIndex, e.target.value)
                      }
                      style={{ width: "90px" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeColorVariant(variantIndex)}
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                      🗑️
                    </button>
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
                        max={MAX_STOCK}
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

        <button
          type="button"
          className={modalStyles.uploadBtn}
          onClick={addColorVariant}
          style={{ marginBottom: "1rem" }}
        >
          ➕ הוסף פילוח לפי צבע
        </button>

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