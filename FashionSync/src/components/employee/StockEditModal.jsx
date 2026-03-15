import { useEffect, useState } from "react";

export default function StockEditModal({ product, isOpen, onClose, onSave }) {
  const [stock, setStock] = useState(0);

  useEffect(() => {
    if (product) {
      setStock(product.stock || 0);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  return (
    <div className="stock-edit-overlay open">
      <div className="stock-edit-box">
        <div className="se-header">
          <div className="se-title">עריכת מלאי</div>
          <button className="se-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="se-product-bar">
          <img className="se-product-img" src={product.img} alt={product.name} />
          <div className="se-product-info">
            <div className="se-product-name">{product.name}</div>
            <div className="se-product-meta">
              {product.code} · {product.cat} · {product.gender}
            </div>
          </div>
          <div className="se-product-price">₪{product.price}</div>
        </div>

        <div className="se-section-title">עריכת כמות</div>

        <div className="color-stock-block">
          <div className="form-group">
            <div className="form-label">כמות חדשה</div>
            <input
              className="size-input-field"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="se-actions">
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
            ביטול
          </button>
          <button
            className="btn btn-gold"
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
