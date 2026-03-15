import styles from "../../../styles/Manager.module.scss";

export default function EditProductModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={styles.editModal} style={{ display: "flex" }} onClick={onClose}>
      <div className={styles.editBox} onClick={(e) => e.stopPropagation()}>
        <h3>עריכת מוצר</h3>
        <label>מחיר (₪)</label>
        <input type="number" min="0" />
        <label>מינימום להתראה</label>
        <input type="number" min="0" />

        <div className={styles.editActions}>
          <button className={styles.save}>שמירה</button>
          <button className={styles.cancel} onClick={onClose}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}