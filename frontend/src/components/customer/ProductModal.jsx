import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

const CATEGORY_SIZE_OPTIONS = {
  חולצות: ["S", "M", "L", "XL"],
  מכנסיים: ["28", "30", "32", "34"],
  שמלות: ["S", "M", "L", "XL"],
  עליוניות: ["S", "M", "L", "XL"],
  נעליים: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  אביזרים: ["אחיד"],
};

export default function ProductModal({
  open = false,
  product = null,
  isGuest = false,
  wished = false,
  selectedColor = "",
  selectedSize = "",
  customColor = "",
  customSize = "",
  closeProductModal,
  toggleWishModal,
  openShareModal,
  setSelectedColor,
  setSelectedSize,
  setCustomColor,
  setCustomSize,
  guestPrompt,
  addToCart,
  openTryOnFromProduct,
  openNotifyModal,
}) {
  const { lang, t: dict } = useLanguage();
  const t = dict.customer.productModal;
  if (!product) return null;

  const isOnSale =
    product.sale &&
    product.originalPrice &&
    product.originalPrice > product.price;

  const colorsFromVariants = (
    product.variants ? product.variants.map((v) => v.colorName) : product.colors || []
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "he"));

  const sizesFromVariants = product.variants
    ? [...new Set(product.variants.flatMap((v) => Object.keys(v.sizes || {})))]
    : product.sizes || [];

  const canonicalSizeOrder = CATEGORY_SIZE_OPTIONS[product.cat] || [];
  const sortedSizes = [...sizesFromVariants].sort(
    (a, b) => canonicalSizeOrder.indexOf(a) - canonicalSizeOrder.indexOf(b)
  );

  const isUniformSizeOnly =
    sortedSizes.length === 1 && sortedSizes[0] === "אחיד";

  const allSizes = isUniformSizeOnly
    ? sortedSizes
    : sortedSizes.includes("אחר")
    ? sortedSizes
    : [...sortedSizes, "אחר"];

  const seasonIcon =
    product.season === "summer" ? "☀️" :
    product.season === "winter" ? "❄️" :
    product.season === "spring-autumn" ? "🌸" : "🗓️";

  const seasonLabel =
    product.season === "summer" ? t.seasonSummer :
    product.season === "winter" ? t.seasonWinter :
    product.season === "spring-autumn" ? t.seasonSpringAutumn :
    product.season === "all" ? t.seasonAllYear :
    product.season || "";

  return (
    <div
      className={`${modalStyles.modalWrap} ${open ? modalStyles.open : ""}`}
      id="product-modal"
    >
      <div className={modalStyles.modalBox}>
        <button
          className={modalStyles.modalClose}
          onClick={closeProductModal}
          style={lang === "en" ? { left: "auto", right: "1.1rem" } : {}}
        >
          ✕
        </button>

        <div className={modalStyles.pdGrid}>
          <div style={{ position: "relative" }}>
            <img className={modalStyles.pdImg} src={product.img} alt={product.name} />
            {product.sale && (
              <div
                style={{
                  position: "absolute",
                  top: ".8rem",
                  right: ".8rem",
                  background: "linear-gradient(135deg, #8e44ad, #a855f7)",
                  color: "#fff",
                  fontSize: ".7rem",
                  fontWeight: 900,
                  padding: ".22rem .6rem",
                  borderRadius: "999px",
                }}
              >
                🏷️ -{
                  product.originalPrice && product.originalPrice > product.price
                    ? Math.round(
                        ((product.originalPrice - product.price) /
                          product.originalPrice) *
                          100
                      )
                    : 0
                }%
              </div>
            )}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: ".5rem" }}>
              <div className={modalStyles.pdTitle}>{product.name}</div>
              <div style={{ display: "flex", gap: ".4rem", flexShrink: 0 }}>
                {isGuest ? (
                  <button style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", opacity: ".4" }} onClick={guestPrompt}>🔒</button>
                ) : (
                  <button style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer" }} onClick={() => toggleWishModal(product.code)}>
                    {wished ? "❤️" : "🤍"}
                  </button>
                )}
                <button style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer" }} onClick={() => openShareModal(product.code)}>📤</button>
              </div>
            </div>

            <div className={modalStyles.pdMeta}>
              {product.code} · {dict.genderLabels[product.gender] || product.gender} · {dict.categoryLabels[product.cat] || product.cat}
            </div>

            <div style={{ marginBottom: ".6rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: ".3rem", padding: ".2rem .65rem", borderRadius: "999px", fontSize: ".76rem", fontWeight: 900, background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.25)", color: "var(--gold)", marginRight: ".6rem" }}>
                {seasonIcon} {seasonLabel}
              </span>
            </div>

            <div className={modalStyles.pdPrice}>
              {isOnSale ? (
                <>
                  <span className="original">₪{product.originalPrice}</span>
                  <span className="current on-sale">₪{product.price}</span>
                </>
              ) : (
                <span className="current">₪{product.price}</span>
              )}
            </div>

            <div className={modalStyles.pdDesc}>{product.desc || ""}</div>

            <div className={modalStyles.pdRow}>
              <div className={modalStyles.pdField}>
                <label>{t.colorLabel}</label>
                <select
                  id="pd-color"
                  value={selectedColor || colorsFromVariants[0] || ""}
                  onChange={(e) => setSelectedColor(e.target.value)}
                >
                  {colorsFromVariants.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div className={modalStyles.pdField}>
                <label>{t.sizeLabel}</label>
                <select
                  id="pd-size"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  <option value="">{t.selectSizePlaceholder}</option>
                  {allSizes.map((size) => {
                    const activeColor = selectedColor || colorsFromVariants[0] || "";
                    const matchingVariant = product.variants?.find(
                      (v) => v.colorName === activeColor
                    );
                    const available =
                      size === "אחר" ||
                      !matchingVariant ||
                      (Number(matchingVariant.sizes?.[size]) || 0) > 0;

                    const displayLabel = size === "אחר" ? t.otherSizeValue : size;

                    return (
                      <option key={size} value={size} disabled={!available}>
                        {displayLabel}{!available ? t.outOfStockSuffix : ""}
                      </option>
                    );
                  })}
                </select>
                {selectedSize === "אחר" && (() => {
                  const isNumericCategory =
                    canonicalSizeOrder.length > 0 &&
                    canonicalSizeOrder.every((s) => !Number.isNaN(Number(s)));
                  const isDuplicate = sortedSizes.some(
                    (s) => s.trim().toLowerCase() === customSize.trim().toLowerCase()
                  );

                  return (
                    <div style={{ marginTop: "0.4rem" }}>
                      <input
                        id="pd-size-other"
                        type="text"
                        placeholder={isNumericCategory ? t.customSizeNumberPlaceholder : t.customSizeLetterPlaceholder}
                        value={customSize}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const filtered = isNumericCategory
                            ? raw.replace(/[^0-9]/g, "")
                            : raw.replace(/[^a-zA-Zא-ת]/g, "").toUpperCase();
                          setCustomSize(filtered.slice(0, 6));
                        }}
                        maxLength={6}
                      />
                      {isDuplicate && customSize.trim() && (
                        <div
                          style={{
                            color: "var(--red, #e74c3c)",
                            fontSize: "0.75rem",
                            marginTop: "0.25rem",
                          }}
                        >
                          {t.duplicateSizeWarning}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {!selectedSize && (
              <div style={{ color: "#e07a5f", fontSize: "0.85rem", textAlign: "center", marginTop: "0.5rem" }}>
                {t.selectSizeBeforeAdd}
              </div>
            )}

            <div className={modalStyles.pdActions}>
              {isGuest ? (
                <>
                  <button className={baseStyles.btn} style={{ border: "1px dashed rgba(201,168,76,.3)", color: "rgba(201,168,76,.6)" }} onClick={guestPrompt}>{t.guestAddToCart}</button>
                  <button className={`${baseStyles.btn} ${baseStyles.btnOutline}`} onClick={() => openTryOnFromProduct(product.code)}>{t.tryOn}</button>
                </>
              ) : product.stock > 0 ? (
                <>
                  <button
                    className={`${baseStyles.btn} ${baseStyles.btnGold}`}
                    onClick={() => addToCart(product.code, true)}
                    disabled={
                      !selectedSize ||
                      (selectedSize === "אחר" &&
                        (!customSize.trim() ||
                          sortedSizes.some(
                            (s) =>
                              s.trim().toLowerCase() ===
                              customSize.trim().toLowerCase()
                          )))
                    }
                  >
                    {t.addToCart}
                  </button>
                  <button className={`${baseStyles.btn} ${baseStyles.btnOutline}`} onClick={() => openTryOnFromProduct(product.code)}>{t.tryOn}</button>
                </>
              ) : (
                <button className={`${baseStyles.btn} ${baseStyles.btnDanger}`} onClick={() => openNotifyModal(product.code)}>{t.notifyMe}</button>
              )}
              <button className={`${baseStyles.btn} ${baseStyles.btnOutline}`} onClick={closeProductModal}>{t.close}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}