import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";

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
  if (!product) return null;

  const isOnSale =
    product.sale &&
    product.originalPrice &&
    product.originalPrice > product.price;

  const colorsFromVariants = product.variants
    ? product.variants.map((v) => v.colorName)
    : product.colors || [];

  const sizesFromVariants = product.variants
    ? [...new Set(product.variants.flatMap((v) => Object.keys(v.sizes || {})))]
    : product.sizes || [];

  const allSizes = sizesFromVariants.includes("אחר")
    ? sizesFromVariants
    : [...sizesFromVariants, "אחר"];

  const seasonIcon =
    product.season === "summer" ? "☀️" :
    product.season === "winter" ? "❄️" :
    product.season === "spring-autumn" ? "🌸" : "🗓️";

  const seasonLabel =
    product.season === "summer" ? "קיץ" :
    product.season === "winter" ? "חורף" :
    product.season === "spring-autumn" ? "אביב / סתיו" :
    product.season === "all" ? "כל השנה" :
    product.season || "";

  return (
    <div
      className={`${modalStyles.modalWrap} ${open ? modalStyles.open : ""}`}
      id="product-modal"
    >
      <div className={modalStyles.modalBox}>
        <button className={modalStyles.modalClose} onClick={closeProductModal}>
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
                🏷️ -20%
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
              {product.code} · {product.gender} · {product.cat}
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
                <label>צבע</label>
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
                <label>מידה *</label>
                <select
                  id="pd-size"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  <option value="">בחר/י מידה...</option>
                  {allSizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                {selectedSize === "אחר" && (
                  <input
                    id="pd-size-other"
                    type="text"
                    placeholder="מידה… "
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value.slice(0, 10))}
                    maxLength={10}
                    style={{ marginTop: "0.4rem" }}
                  />
                )}
              </div>
            </div>

            {!selectedSize && (
              <div style={{ color: "#e07a5f", fontSize: "0.85rem", textAlign: "center", marginTop: "0.5rem" }}>
                יש לבחור מידה לפני ההוספה לסל
              </div>
            )}

            <div className={modalStyles.pdActions}>
              {isGuest ? (
                <>
                  <button className={baseStyles.btn} style={{ border: "1px dashed rgba(201,168,76,.3)", color: "rgba(201,168,76,.6)" }} onClick={guestPrompt}>🔒 התחבר לסל</button>
                  <button className={`${baseStyles.btn} ${baseStyles.btnOutline}`} onClick={() => openTryOnFromProduct(product.code)}>📷 נסה עליי</button>
                </>
              ) : product.stock > 0 ? (
                <>
                  <button
                    className={`${baseStyles.btn} ${baseStyles.btnGold}`}
                    onClick={() => addToCart(product.code, true)}
                    disabled={!selectedSize || (selectedSize === "אחר" && !customSize.trim())}
                  >
                    🛒 הוסף לסל
                  </button>
                  <button className={`${baseStyles.btn} ${baseStyles.btnOutline}`} onClick={() => openTryOnFromProduct(product.code)}>📷 נסה עליי</button>
                </>
              ) : (
                <button className={`${baseStyles.btn} ${baseStyles.btnDanger}`} onClick={() => openNotifyModal(product.code)}>🔔 הודע לי</button>
              )}
              <button className={`${baseStyles.btn} ${baseStyles.btnOutline}`} onClick={closeProductModal}>סגור</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}