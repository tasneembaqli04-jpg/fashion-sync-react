import { useEffect, useState } from "react";
import modalStyles from "../../styles/employee/EmployeeModals.module.scss";
import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";

export default function StockEditModal({ product, isOpen, onClose, onSave }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (product) {
      setForm({
        ...product,
        season: product.season || "all",
        variants: product.variants && product.variants.length > 0 
          ? product.variants 
          : [{ colorName: "לבן", colorHex: "#ffffff", sizes: { S: 0, M: 0, L: 0, XL: 0 } }]
      });
    }
  }, [product]);

  if (!isOpen || !form) return null;

  const getSeasonLabel = (s) => {
    const seasons = {
      'summer': 'קיץ',
      'winter': 'חורף',
      'spring-autumn': 'אביב-סתיו',
      'all': 'כל השנה'
    };
    return seasons[s] || seasons['all'];
  };

  const handleSizeChange = (colorIndex, size, value) => {
    const newVariants = form.variants.map((variant, idx) => {
      if (idx === colorIndex) {
        return {
          ...variant,
          sizes: {
            ...variant.sizes,
            [size]: parseInt(value, 10) || 0 
          }
        };
      }
      return variant;
    });

    setForm({ ...form, variants: newVariants });
  };

  return (
    <div className={`${modalStyles.stockEditOverlay} ${modalStyles.open}`}>
      <div className={modalStyles.stockEditBox}>
        <div className={modalStyles.seHeader}>
          <div className={modalStyles.seTitle}>עריכת מלאי ופרטים</div>
          <button className={modalStyles.seClose} onClick={onClose}>✕</button>
        </div>

        <div className={modalStyles.seProductBar}>
          <img className={modalStyles.seProductImg} src={form.img} alt={form.name} />
          <div className={modalStyles.seProductInfo}>
            <div className={modalStyles.seProductName}>{form.name}</div>
            <div className={modalStyles.seProductMeta}>
              {form.code} · {form.cat} · {form.gender}
            </div>
          </div>
          <div className={modalStyles.seProductPrice}>₪{form.price}</div>
        </div>
        
        <div className={modalStyles.formHeaderGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          
          <div className={layoutStyles.formGroup}>
            <div className={layoutStyles.formLabel}>עונה</div>
            <div 
              className={layoutStyles.formInput} 
              style={{ backgroundColor: 'var(--surface3)', display: 'flex', alignItems: 'center', opacity: 0.8 }}
            >
              {getSeasonLabel(form.season)}
            </div>
          </div>

          <div className={layoutStyles.formGroup}>
            <div className={layoutStyles.formLabel}>מחיר פריט (₪)</div>
            <input 
              type="number"
              className={layoutStyles.formInput}
              value={form.price}
              onChange={(e) => setForm({...form, price: parseFloat(e.target.value) || 0})}
              style={{ color: 'var(--gold)', fontWeight: 'bold' }}
            />
          </div>
        </div>

        <div className={modalStyles.seSectionTitle}>עריכת כמות לפי צבע / מידה</div>

        <div className={modalStyles.variantsContainer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingLeft: '5px' }}>
          {form.variants.map((variant, vIdx) => (
            <div key={vIdx} className={modalStyles.colorStockBlock}>
              <div className={modalStyles.colorBlockHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div 
                    style={{ 
                      width: '14px', height: '14px', borderRadius: '50%', 
                      backgroundColor: variant.colorHex, border: '1px solid rgba(255,255,255,0.2)' 
                    }} 
                  />
                  <span className={modalStyles.colorBlockName}>{variant.colorName} 🎨</span>
                </div>
                <span className={modalStyles.colorBlockTotal}>
                  סה"כ: {Object.values(variant.sizes).reduce((a, b) => a + (parseInt(b) || 0), 0)} יח'
                </span>
              </div>
              
              <div className={modalStyles.sizeInputsRow}>
                {['S', 'M', 'L', 'XL'].map((size) => (
                  <div key={size} className={modalStyles.sizeInputCell}>
                    <div className={modalStyles.sizeInputLabel}>{size}</div>
                    <input
                      className={modalStyles.sizeInputField}
                      type="number"
                      min="0"
                      value={variant.sizes[size] || 0}
                      onChange={(e) => handleSizeChange(vIdx, size, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={modalStyles.seActions}>
          <button className={`${layoutStyles.btn} ${layoutStyles.btnOutline}`} style={{ flex: 1 }} onClick={onClose}>
            ביטול
          </button>
          <button
            className={`${layoutStyles.btn} ${layoutStyles.btnGold}`}
            style={{ flex: 2 }}
            onClick={() => {
              const finalStock = form.variants.reduce((sum, v) => 
                sum + Object.values(v.sizes).reduce((acc, qty) => acc + (parseInt(qty) || 0), 0), 0
              );
              onSave(form.code, { ...form, stock: finalStock });
            }}
          >
            💾 שמירה
          </button>
        </div>
      </div>
    </div>
  );
}