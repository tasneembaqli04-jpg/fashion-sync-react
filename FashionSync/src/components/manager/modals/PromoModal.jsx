import styles from "../../../styles/Manager.module.scss";

export default function PromoModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={`${styles.modalOv} ${styles.open}`} onClick={onClose}>
      <div className={styles.promoModalBox} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          ✕
        </button>

        <div className={styles.promoModalTitle}>📢 הפעלת פרסומת למוצר</div>

        <div></div>

        <div style={{ display: "flex", gap: "0.7rem", marginTop: "1.1rem" }}>
          <button className={styles.btnGold} style={{ flex: 1 }}>
            🚀 הפעל פרסומת
          </button>

          <button className={styles.btnGhost} onClick={onClose}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}