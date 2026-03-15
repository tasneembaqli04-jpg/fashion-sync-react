import styles from "../../../styles/Manager.module.scss";

export default function AddProductModal({ open, onClose, onOpenCamera, onOpenScan }) {
  if (!open) return null;

  return (
    <div className={`${styles.modalOv} ${styles.open}`} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          ✕
        </button>

        <div className={styles.modalTitle}>➕ מוצר חדש</div>

        <div className={styles.fg2}>
          <div className={styles.fg}>
            <div className={styles.fl}>קוד</div>
            <div style={{ display: "flex", gap: "0.45rem" }}>
              <input className={styles.fi} placeholder="FS-XXX" style={{ flex: 1 }} />
              <button
                type="button"
                className={styles.btnBlue}
                style={{ padding: "0.5rem 0.8rem", fontSize: "0.82rem", flexShrink: 0 }}
                onClick={onOpenScan}
                title="סרוק ברקוד"
              >
                📷
              </button>
            </div>
          </div>

          <div className={styles.fg}>
            <div className={styles.fl}>שם</div>
            <input className={styles.fi} placeholder="שם המוצר" />
          </div>

          <div className={styles.fg}>
            <div className={styles.fl}>קטגוריה</div>
            <input className={styles.fi} placeholder="בחר או הקלד קטגוריה..." />
          </div>

          <div className={styles.fg}>
            <div className={styles.fl}>מגדר</div>
            <select className={styles.fi}>
              <option>נשים</option>
              <option>גברים</option>
            </select>
          </div>

          <div className={styles.fg}>
            <div className={styles.fl}>כמות</div>
            <input className={styles.fi} type="number" placeholder="0" />
          </div>

          <div className={styles.fg}>
            <div className={styles.fl}>מחיר (₪)</div>
            <input className={styles.fi} type="number" placeholder="0" />
          </div>
        </div>

        <div className={styles.fg}>
          <div className={styles.fl}>מינימום להתראה</div>
          <input className={styles.fi} type="number" defaultValue="10" />
        </div>

        <div className={styles.fg}>
          <div className={styles.fl}>תיאור</div>
          <input className={styles.fi} placeholder="תיאור קצר..." />
        </div>

        <div className={styles.fg}>
          <div className={styles.fl}>תמונת מוצר</div>

          <div className={styles.imgUploadZone}>
            <div className={styles.imgPlaceholder}>
              <div className={styles.imgPlaceholderIcon}>📷</div>
              <div className={styles.imgPlaceholderText}>תמונת מוצר</div>

              <div className={styles.imgBtns} style={{ marginTop: "0.65rem" }}>
                <button type="button" className={styles.imgBtn}>
                  📁 קובץ
                </button>
                <button type="button" className={styles.imgBtn} onClick={onOpenCamera}>
                  📸 צלם
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.alert} ${styles.aDanger}`} style={{ display: "none", marginBottom: "0.55rem" }}>
          ❌ יש למלא את כל השדות
        </div>

        <button
          className={styles.btnGold}
          style={{
            width: "100%",
            marginTop: "0.3rem",
            padding: "0.82rem",
            justifyContent: "center",
          }}
        >
          הוסף מוצר
        </button>
      </div>
    </div>
  );
}