import { useState } from "react";

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
    <div className="newprod-overlay open">
      <div className="newprod-box">
        <div className="newprod-header">
          <div className="newprod-title">➕ מוצר חדש</div>
          <button className="newprod-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <div className="form-label">קוד</div>
            <input
              className="form-input"
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="form-label">שם</div>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="form-label">קטגוריה</div>
            <select
              className="form-input"
              value={form.cat}
              onChange={(e) => handleChange("cat", e.target.value)}
            >
              <option>חולצות</option>
              <option>מכנסיים</option>
              <option>שמלות</option>
              <option>עליוניות</option>
            </select>
          </div>

          <div className="form-group">
            <div className="form-label">מגדר</div>
            <select
              className="form-input"
              value={form.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
            >
              <option>נשים</option>
              <option>גברים</option>
            </select>
          </div>

          <div className="form-group">
            <div className="form-label">כמות</div>
            <input
              className="form-input"
              type="number"
              value={form.qty}
              onChange={(e) => handleChange("qty", Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <div className="form-label">מחיר</div>
            <input
              className="form-input"
              type="number"
              value={form.price}
              onChange={(e) => handleChange("price", Number(e.target.value))}
            />
          </div>

          <div className="form-group full">
            <div className="form-label">תיאור</div>
            <textarea
              className="form-input"
              value={form.desc}
              onChange={(e) => handleChange("desc", e.target.value)}
            />
          </div>

          <div className="form-group full">
            <div className="form-label">קישור לתמונה</div>
            <input
              className="form-input"
              value={form.img}
              onChange={(e) => handleChange("img", e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.65rem", marginTop: "1.4rem" }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
            ביטול
          </button>

          <button className="btn btn-gold" style={{ flex: 2 }} onClick={handleSave}>
            הוסף מוצר
          </button>
        </div>
      </div>
    </div>
  );
}
