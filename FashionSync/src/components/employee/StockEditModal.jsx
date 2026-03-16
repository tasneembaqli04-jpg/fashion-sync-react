import { useEffect, useState } from "react";
import modalStyles from "../../styles/employee/EmployeeModals.module.scss";
import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";

export default function StockEditModal({ product, isOpen, onClose, onSave }) {
  const [stock, setStock] = useState(0);

  useEffect(() => {
    if (product) {
      setStock(product.stock || 0);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  return (
    <div className={`${modalStyles.stockEditOverlay} ${modalStyles.open}`}>
      <div className={modalStyles.stockEditBox}>
        <div className={modalStyles.seHeader}>
          <div className={modalStyles.seTitle}>עריכת מלאי</div>
          <button className={modalStyles.seClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={modalStyles.seProductBar}>
          <img
            className={modalStyles.seProductImg}
            src={product.img}
            alt={product.name}
          />
          <div className={modalStyles.seProductInfo}>
            <div className={modalStyles.seProductName}>{product.name}</div>
            <div className={modalStyles.seProductMeta}>
              {product.code} · {product.cat} · {product.gender}
            </div>
          </div>
          <div className={modalStyles.seProductPrice}>₪{product.price}</div>
        </div>

        <div className={modalStyles.seSectionTitle}>עריכת כמות</div>

        <div className={modalStyles.colorStockBlock}>
          <div className={layoutStyles.formGroup}>
            <div className={layoutStyles.formLabel}>כמות חדשה</div>
            <input
              className={modalStyles.sizeInputField}
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />
          </div>
        </div>

        <div className={modalStyles.seActions}>
          <button
            className={`${layoutStyles.btn} ${layoutStyles.btnOutline}`}
            style={{ flex: 1 }}
            onClick={onClose}
          >
            ביטול
          </button>

          <button
            className={`${layoutStyles.btn} ${layoutStyles.btnGold}`}
            style={{ flex: 2 }}
            onClick={() => onSave(product.code, stock)}
          >
            💾 שמירה
          </button>
        </div>
      </div>
    </div>
  );
}
