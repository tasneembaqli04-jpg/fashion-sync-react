import { useEffect, useMemo, useState } from "react";
import styles from "../../../styles/Manager.module.scss";

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
}) {
  const [price, setPrice] = useState(0);
  const [minStock, setMinStock] = useState(10);
  const [variantsDraft, setVariantsDraft] = useState([]);

  useEffect(() => {
    if (!product) return;
    setPrice(product.price || 0);
    setMinStock(product.minStock || 10);
    setVariantsDraft(deepCopyVariants(product.variants || []));
  }, [product]);

  const totalStock = useMemo(
    () => calcVariantsTotal(variantsDraft),
    [variantsDraft]
  );

  if (!isOpen || !product) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleQtyChange = (variantIndex, sizeKey, value) => {
    const safeValue = Math.max(0, parseInt(value || "0", 10) || 0);

    setVariantsDraft((prev) =>
      prev.map((variant, index) =>
        index !== variantIndex
          ? variant
          : {
              ...variant,
              sizes: {
                ...variant.sizes,
                [sizeKey]: safeValue,
              },
            }
      )
    );
  };

  const handleSave = () => {
    onSave({
      ...product,
      price: Number(price),
      minStock: Number(minStock),
      variants: variantsDraft,
      stock: totalStock,
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.detailsModalBox}>
        <button className={styles.modalCloseBtn} onClick={onClose}>
          ✕
        </button>

        <div className={styles.detailsTopSection}>
  <div className={styles.detailsTopRight}>
    <div className={styles.detailsTitle}>פרטים — {product.name}</div>

    <div className={styles.detailsMeta}>
      <span className={`${styles.tag} ${styles.tGold}`}>{product.code}</span>
      <span className={`${styles.tag} ${styles.tBlue}`}>{product.cat}</span>
      <span
        className={`${styles.tag} ${
          product.gender === "נשים" ? styles.tPurple : styles.tOrange
        }`}
      >
        {product.gender}
      </span>
      <span className={`${styles.tag} ${styles.tGreen}`}>
        מלאי: {totalStock}
      </span>
      <span className={`${styles.tag} ${styles.tGold}`}>₪{price}</span>
    </div>

    <div className={styles.detailsName}>{product.name}</div>
    <div className={styles.detailsDescription}>{product.desc}</div>
  </div>

  <img
    src={product.img}
    alt={product.name}
    className={styles.detailsProductImage}
  />
</div>



        <div className={styles.detailsFieldsGrid}>
          <div className={styles.fg}>
            <div className={styles.fl}>מחיר (₪)</div>
            <input
              className={styles.fi}
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className={styles.fg}>
            <div className={styles.fl}>מינימום להתראה</div>
            <input
              className={styles.fi}
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.detailsSectionRow}>
          <span className={styles.detailsSectionLabel}>
            עריכת כמות לפי צבע/מידה
          </span>
        </div>

        <div className={styles.detailsVariantsWrap}>
          {variantsDraft.map((variant, variantIndex) => {
            const sizesEntries = Object.entries(variant.sizes || {});
            const variantTotal = sizesEntries.reduce(
              (sum, [, qty]) => sum + (parseInt(qty, 10) || 0),
              0
            );

            return (
              <div
                key={`${variant.colorName}-${variantIndex}`}
                className={styles.colorCard}
              >
                <div className={styles.colorCardHead}>
                  <span className={`${styles.tag} ${styles.tGold}`}>
                    סה״כ: {variantTotal} יח׳
                  </span>

                  <div className={styles.colorCardTitleWrap}>
                    <strong>{variant.colorName || "צבע"}</strong>
                    <span
                      className={styles.dot}
                      style={{ background: variant.colorHex || "#999" }}
                    />
                  </div>
                </div>

                <div className={styles.sizesGrid}>
                  {sizesEntries.map(([sizeKey, qty]) => (
                    <label key={sizeKey} className={styles.sizePill}>
                      <strong>{sizeKey}</strong>
                      <span className={styles.sizeSeparator}>•</span>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) =>
                          handleQtyChange(
                            variantIndex,
                            sizeKey,
                            e.target.value
                          )
                        }
                        className={styles.sizeQtyInput}
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.detailsFooter}>
          <button className={styles.detailsSaveBtn} onClick={handleSave}>
            שמירה 💾
          </button>
        </div>
      </div>
    </div>
  );
}
