import { useState } from "react";
import styles from "../../styles/employee/EmployeeModals.module.scss";
import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";

export default function NewProductModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    cat: "חולצות",
    gender: "נשים",
    qty: 0,
    price: 0,
    desc: "",
    img: "",
  });

  if (!isOpen) return null;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    onSave(form);
    setForm({
      code: "",
      name: "",
      cat: "חולצות",
      gender: "נשים",
      qty: 0,
      price: 0,
      desc: "",
      img: "",
    });
  }

  return (
    <div className={`${styles.newprodOverlay} ${styles.open}`}>
      <div className={styles.newprodBox}>
        <div className={styles.newprodHeader}>
          <div className={styles.newprodTitle}>➕ מוצר חדש</div>
          <button className={styles.newprodClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={layoutStyles.formGrid}>
          <div className={layoutStyles.formGroup}>
            <div className={layoutStyles.formLabel}>קוד</div>
            <input
              className={layoutStyles.formInput}
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value)}
            />
          </div>

          <div className={layoutStyles.formGroup}>
            <div className={layoutStyles.formLabel}>שם</div>
            <input
              className={layoutStyles.formInput}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className={layoutStyles.formGroup}>
            <div className={layoutStyles.formLabel}>קטגוריה</div>
            <select
              className={layoutStyles.formInput}
              value={form.cat}
              onChange={(e) => handleChange("cat", e.target.value)}
            >
              <option>חולצות</option>
              <option>מכנסיים</option>
              <option>שמלות</option>
              <option>עליוניות</option>
            </select>
          </div>

          <div className={layoutStyles.formGroup}>
            <div className={layoutStyles.formLabel}>מגדר</div>
            <select
              className={layoutStyles.formInput}
              value={form.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
            >
              <option>נשים</option>
              <option>גברים</option>
            </select>
          </div>

          <div className={layoutStyles.formGroup}>
            <div className={layoutStyles.formLabel}>כמות</div>
            <input
              className={layoutStyles.formInput}
              type="number"
              value={form.qty}
              onChange={(e) => handleChange("qty", Number(e.target.value))}
            />
          </div>

          <div className={layoutStyles.formGroup}>
            <div className={layoutStyles.formLabel}>מחיר</div>
            <input
              className={layoutStyles.formInput}
              type="number"
              value={form.price}
              onChange={(e) => handleChange("price", Number(e.target.value))}
            />
          </div>

          <div className={`${layoutStyles.formGroup} ${layoutStyles.full}`}>
            <div className={layoutStyles.formLabel}>תיאור</div>
            <textarea
              className={layoutStyles.formInput}
              value={form.desc}
              onChange={(e) => handleChange("desc", e.target.value)}
            />
          </div>

          <div className={`${layoutStyles.formGroup} ${layoutStyles.full}`}>
            <div className={layoutStyles.formLabel}>קישור לתמונה</div>
            <input
              className={layoutStyles.formInput}
              value={form.img}
              onChange={(e) => handleChange("img", e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.65rem", marginTop: "1.4rem" }}>
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
            onClick={handleSave}
          >
            הוסף מוצר
          </button>
        </div>
      </div>
    </div>
  );
}