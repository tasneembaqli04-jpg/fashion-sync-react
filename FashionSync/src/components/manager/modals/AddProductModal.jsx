import { useRef, useState } from "react";
import styles from "../../../styles/Manager.module.scss";

export default function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
}) {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    cat: "חולצות",
    gender: "נשים",
    stock: "0",
    price: "0",
    minStock: "10",
    desc: "",
    image: "",
  });

  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      cat: "חולצות",
      gender: "נשים",
      stock: "0",
      price: "0",
      minStock: "10",
      desc: "",
      image: "",
    });
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("⚠️ יש לבחור קובץ תמונה");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      handleChange("image", event.target?.result || "");
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (
      !form.code.trim() ||
      !form.name.trim() ||
      !form.cat.trim() ||
      !form.gender.trim() ||
      form.stock === "" ||
      form.price === "" ||
      form.minStock === "" ||
      !form.desc.trim() ||
      !form.image
    ) {
      setError("❌ יש למלא את כל השדות ולהוסיף תמונה");
      return;
    }

    const newProduct = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      cat: form.cat,
      gender: form.gender,
      stock: Number(form.stock),
      price: Number(form.price),
      minStock: Number(form.minStock),
      desc: form.desc.trim(),
      img: form.image,
      notifyCount: 0,
      trending: false,
      bestseller: false,
      salesLastMonth: 0,
      variants: [],
    };

    onSubmit(newProduct);
    handleClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.addProductModal}>
        <button className={styles.modalCloseBtn} onClick={handleClose}>
          ✕
        </button>

        <div className={styles.addProductHeader}>
          <h2 className={styles.addProductTitle}>מוצר חדש</h2>
          <span className={styles.addProductPlus}>＋</span>
        </div>

        <div className={styles.addProductGrid}>
          <div className={styles.addField}>
            <label className={styles.addLabel}>קוד</label>
            <input
              className={styles.addInput}
              placeholder="FS-XXX"
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value)}
            />
          </div>

          <div className={styles.addField}>
            <label className={styles.addLabel}>שם</label>
            <input
              className={styles.addInput}
              placeholder="שם המוצר"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className={styles.addField}>
            <label className={styles.addLabel}>קטגוריה</label>
            <select
              className={styles.addInput}
              value={form.cat}
              onChange={(e) => handleChange("cat", e.target.value)}
            >
              <option value="חולצות">חולצות</option>
              <option value="מכנסיים">מכנסיים</option>
              <option value="שמלות">שמלות</option>
              <option value="עליוניות">עליוניות</option>
            </select>
          </div>

          <div className={styles.addField}>
            <label className={styles.addLabel}>מגדר</label>
            <select
              className={styles.addInput}
              value={form.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
            >
              <option value="נשים">נשים</option>
              <option value="גברים">גברים</option>
            </select>
          </div>

          <div className={styles.addField}>
            <label className={styles.addLabel}>כמות</label>
            <input
              className={styles.addInput}
              type="number"
              value={form.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
            />
          </div>

          <div className={styles.addField}>
            <label className={styles.addLabel}>מחיר (₪)</label>
            <input
              className={styles.addInput}
              type="number"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
            />
          </div>
        </div>

        <div className={styles.addFieldFull}>
          <label className={styles.addLabel}>מינימום להתראה</label>
          <input
            className={styles.addInput}
            type="number"
            value={form.minStock}
            onChange={(e) => handleChange("minStock", e.target.value)}
          />
        </div>

        <div className={styles.addFieldFull}>
          <label className={styles.addLabel}>תיאור</label>
          <input
            className={styles.addInput}
            placeholder="תיאור קצר..."
            value={form.desc}
            onChange={(e) => handleChange("desc", e.target.value)}
          />
        </div>

        <div className={styles.addFieldFull}>
          <label className={styles.addLabel}>תמונת מוצר</label>

          <div className={styles.imageUploadBox}>
            {form.image ? (
              <>
                <img
                  src={form.image}
                  alt="תצוגה מקדימה"
                  className={styles.imagePreview}
                />
                <button
                  className={styles.removeImageBtn}
                  onClick={() => handleChange("image", "")}
                >
                  הסר תמונה 🗑️
                </button>
              </>
            ) : (
              <>
                <div className={styles.uploadIcon}>📷</div>
                <div className={styles.uploadText}>תמונת מוצר</div>

                <div className={styles.uploadActions}>
                  <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    העלה קובץ 📁
                  </button>

                  <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={() => alert("נחבר מצלמה בשלב הבא")}
                  >
                    צלם עכשיו 📸
                  </button>
                </div>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {error && <div className={styles.addError}>{error}</div>}

        <div className={styles.addModalFooter}>
          <button className={styles.addSubmitBtn} onClick={handleSubmit}>
            הוסף מוצר
          </button>
        </div>
      </div>
    </div>
  );
}
