import { useEffect, useState } from "react";
import styles from "../../../styles/Manager.module.scss";
import {
  getVariantTotal,
  getProductStockFromVariants,
  sanitizeQtyInput,
} from "../../../functions/manager/inventoryFunctions";

export default function DetailsModal({
  open,
  onClose,
  product,
  onSaveDetails,
}) {
  const [variants, setVariants] = useState([]);
  const [minStock, setMinStock] = useState(0);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (product?.variants) {
      const clonedVariants = product.variants.map((variant) => ({
        ...variant,
        sizes: { ...variant.sizes },
      }));
      setVariants(clonedVariants);
    }

    setMinStock(product?.minStock ?? 0);
    setPrice(product?.price ?? 0);
  }, [product]);

  if (!open || !product) return null;

  function handleQtyChange(variantIndex, size, value) {
    const cleanValue = sanitizeQtyInput(value);

    setVariants((prev) =>
      prev.map((variant, index) => {
        if (index !== variantIndex) return variant;

        return {
          ...variant,
          sizes: {
            ...variant.sizes,
            [size]: cleanValue,
          },
        };
      })
    );
  }

  function handleMinStockChange(value) {
    setMinStock(sanitizeQtyInput(value));
  }

  function handlePriceChange(value) {
    setPrice(sanitizeQtyInput(value));
  }

  function handleSave() {
    const updatedProduct = {
      ...product,
      variants,
      stock: getProductStockFromVariants(variants),
      minStock,
      price,
    };

    if (onSaveDetails) {
      onSaveDetails(updatedProduct);
    }

    onClose();
  }

  return (
    <div
      className={styles.editModal}
      style={{ display: "flex" }}
      onClick={onClose}
    >
      <div
        className={styles.detailsBox}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.detailsHead}>
          <div>
            <div className={styles.detailsTitle}>
              פרטים — {product.name}
            </div>

            <div className={styles.detailsMeta}>
              <span className={`${styles.tag} ${styles.tGold}`}>
                {product.code}
              </span>

              <span className={`${styles.tag} ${styles.tBlue}`}>
                {product.cat}
              </span>

              <span
                className={`${styles.tag} ${
                  product.gender === "נשים" ? styles.tPurple : styles.tOrange
                }`}
              >
                {product.gender}
              </span>

              <span className={`${styles.tag} ${styles.tGreen}`}>
                מלאי: {getProductStockFromVariants(variants)}
              </span>

              <span className={`${styles.tag} ${styles.tGold}`}>
                ₪{price}
              </span>
            </div>
          </div>

          <button className={styles.detailsClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.detailsTopSection}>
          <img
            src={product.img}
            alt={product.name}
            className={styles.detailsProductImage}
          />

          <div className={styles.detailsTopInfo}>
            <div className={styles.detailsProductName}>{product.name}</div>
            <div className={styles.detailsProductDesc}>{product.desc}</div>

            <div className={styles.detailsMiniGrid}>
              <div className={styles.detailsMiniCard}>
                <div className={styles.detailsMiniLabel}>מינימום להתראה</div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={minStock}
                  onChange={(e) => handleMinStockChange(e.target.value)}
                  className={styles.detailsMiniInput}
                />
              </div>

              <div className={styles.detailsMiniCard}>
                <div className={styles.detailsMiniLabel}>מחיר (₪)</div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className={styles.detailsMiniInput}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.detailsVariantsTitle}>
          עריכת כמות לפי צבע / מידה
        </div>

        <div className={styles.detailsVariantsList}>
          {variants.map((variant, index) => (
            <div key={`${product.code}-${index}`} className={styles.colorCard}>
              <div className={styles.colorCardHeader}>
                <div className={styles.colorCardTitle}>
                  <span
                    className={styles.dot}
                    style={{ background: variant.colorHex }}
                  ></span>
                  <strong>{variant.colorName}</strong>
                </div>

                <span className={`${styles.tag} ${styles.tGold}`}>
                  סה״כ: {getVariantTotal(variant)} יח׳
                </span>
              </div>

              <div className={styles.colorCardSizes}>
                {Object.entries(variant.sizes).map(([size, qty]) => (
                  <div key={size} className={styles.sizePill}>
                    <strong>{size}</strong>
                    <span>•</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={qty}
                      onChange={(e) =>
                        handleQtyChange(index, size, e.target.value)
                      }
                      className={styles.sizeQtyInput}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.detailsFooter}>
          <button className={styles.btnGold} onClick={handleSave}>
            שמירה
          </button>
        </div>
      </div>
    </div>
  );
}
