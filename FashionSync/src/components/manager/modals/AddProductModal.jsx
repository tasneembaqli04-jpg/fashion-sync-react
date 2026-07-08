import { useRef, useState } from "react";
import styles from "../../../styles/manager/ManagerModals.module.scss";
import ScanModal from "./ScanModal";
import { CATEGORIES } from "../../../data/categories";

const CATEGORY_SIZE_OPTIONS = {
  חולצות: ["S", "M", "L", "XL"],
  מכנסיים: ["28", "30", "32", "34"],
  שמלות: ["S", "M", "L", "XL"],
  עליוניות: ["S", "M", "L", "XL"],
  נעליים: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  אביזרים: ["אחיד"],
};

export default function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  onOpenScanner,
  theme,
}) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    cat: "חולצות",
    gender: "נשים",
    season: "",
    stock: "0",
    price: "0",
    minStock: "10",
    desc: "",
    image: "",
  });

  const [uploadMode, setUploadMode] = useState("file");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState("");
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [variantsDraft, setVariantsDraft] = useState([]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addColorVariant = () => {
    const sizeKeys = CATEGORY_SIZE_OPTIONS[form.cat] || ["S", "M", "L"];
    const sizes = {};
    sizeKeys.forEach((key) => {
      sizes[key] = 0;
    });

    setVariantsDraft((prev) => [
      ...prev,
      { colorName: "", colorHex: "#999999", sizes },
    ]);
  };

  const removeColorVariant = (variantIndex) => {
    setVariantsDraft((prev) => prev.filter((_, index) => index !== variantIndex));
  };

  const handleColorNameChange = (variantIndex, value) => {
    setVariantsDraft((prev) =>
      prev.map((variant, index) =>
        index !== variantIndex ? variant : { ...variant, colorName: value }
      )
    );
  };

  const handleColorHexChange = (variantIndex, value) => {
    setVariantsDraft((prev) =>
      prev.map((variant, index) =>
        index !== variantIndex ? variant : { ...variant, colorHex: value }
      )
    );
  };

  const handleVariantQtyChange = (variantIndex, sizeKey, value) => {
    const safeValue = Math.max(0, parseInt(value || "0", 10) || 0);
    setVariantsDraft((prev) =>
      prev.map((variant, index) =>
        index !== variantIndex
          ? variant
          : { ...variant, sizes: { ...variant.sizes, [sizeKey]: safeValue } }
      )
    );
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  };

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      cat: "חולצות",
      gender: "נשים",
      season: "",
      stock: "0",
      price: "0",
      minStock: "10",
      desc: "",
      image: "",
    });
    setError("");
    setUploadMode("file");
    setVariantsDraft([]);
    stopCamera();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      setError("לא ניתן לגשת למצלמה — " + (err.message || err.name));
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;

    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    handleChange("image", dataUrl);
    stopCamera();
    setUploadMode("file");
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
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (
      !form.code.trim() ||
      !form.name.trim() ||
      !form.cat.trim() ||
      !form.gender.trim() ||
      !form.season ||
      form.stock === "" ||
      form.price === "" ||
      form.minStock === "" ||
      !form.desc.trim() ||
      !form.image
    ) {
      setError("❌ יש למלא את כל השדות ולהוסיף תמונה");
      return;
    }

    const cleanedVariants = variantsDraft.filter(
      (variant) => (variant.colorName || "").trim() !== ""
    );
    const hasVariants = cleanedVariants.length > 0;
    const variantsTotal = cleanedVariants.reduce(
      (sum, variant) =>
        sum +
        Object.values(variant.sizes || {}).reduce(
          (innerSum, qty) => innerSum + (Number(qty) || 0),
          0
        ),
      0
    );

    const newProduct = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      cat: form.cat,
      gender: form.gender,
      season: form.season,
      stock: hasVariants ? variantsTotal : Number(form.stock),
      price: Number(form.price),
      minStock: Number(form.minStock),
      desc: form.desc.trim(),
      img: form.image,
      notifyCount: 0,
      trending: false,
      bestseller: false,
      salesLastMonth: 0,
      variants: cleanedVariants,
    };

    onSubmit(newProduct);
    handleClose();
  };

  return (
    <div
      className={`${styles.modalOverlay} ${theme === "light" ? styles.light : ""}`}
    >
      <div className={styles.addProductModal}>
        <button className={styles.modalCloseBtn} onClick={handleClose}>
          ✕
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            direction: "rtl",
            gap: "0.6rem",
            marginBottom: "1.8rem",
          }}
        >
          <span
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "#8f6bff",
              lineHeight: 1,
            }}
          >
            ＋
          </span>

          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.7rem",
              color: "var(--gold)",
              margin: 0,
            }}
          >
            מוצר חדש
          </h2>
        </div>

        <div className={styles.addProductGrid}>
          <div className={styles.addField}>
            <label className={styles.addLabel}>קוד</label>
            <div style={{ display: "flex", gap: "0.45rem" }}>
              <input
                className={styles.addInput}
                placeholder="FS-XXX"
                value={form.code}
                onChange={(e) => handleChange("code", e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setIsScanOpen(true)}
                title="סרוק ברקוד"
                style={{
                  background: "rgba(52,152,219,0.1)",
                  border: "1px solid rgba(52,152,219,0.25)",
                  color: "var(--blue)",
                  borderRadius: "14px",
                  padding: "0 1rem",
                  fontSize: "1rem",
                  cursor: "pointer",
                  flexShrink: 0,
                  height: "54px",
                }}
              >
                📷
              </button>
            </div>
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
              onChange={(e) => {
                const newCat = e.target.value;
                handleChange("cat", newCat);

                const sizeKeys = CATEGORY_SIZE_OPTIONS[newCat] || ["S", "M", "L"];
                setVariantsDraft((prev) =>
                  prev.map((variant) => {
                    const sizes = {};
                    sizeKeys.forEach((key) => {
                      sizes[key] = 0;
                    });
                    return { ...variant, sizes };
                  })
                );
              }}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
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
            <label className={styles.addLabel}>עונה</label>
            <select
              className={styles.addInput}
              value={form.season}
              onChange={(e) => handleChange("season", e.target.value)}
              style={{ color: form.season ? "var(--text)" : "var(--muted)" }}
            >
              <option value="" disabled>
                בחר עונה...
              </option>
              <option value="all">כל השנה</option>
              <option value="summer">קיץ</option>
              <option value="winter">חורף</option>
              <option value="spring-autumn">אביב-סתיו</option>
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

          <div className={styles.addField}>
            <label className={styles.addLabel}>מינימום להתראה</label>
            <input
              className={styles.addInput}
              type="number"
              value={form.minStock}
              onChange={(e) => handleChange("minStock", e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: "0.6rem" }}>
          {variantsDraft.map((variant, variantIndex) => {
            const sizesEntries = Object.entries(variant.sizes || {});
            const variantTotal = sizesEntries.reduce(
              (sum, [, qty]) => sum + (parseInt(qty, 10) || 0),
              0
            );

            return (
              <div key={variantIndex} className={styles.colorCard} style={{ marginBottom: "0.7rem" }}>
                <div className={styles.colorCardHead}>
                  <span>סה״כ: {variantTotal} יח׳</span>

                  <div className={styles.colorCardTitleWrap}>
                    <input
                      type="text"
                      placeholder="שם הצבע"
                      value={variant.colorName || ""}
                      onChange={(e) =>
                        handleColorNameChange(variantIndex, e.target.value)
                      }
                      style={{ width: "90px" }}
                    />
                    <input
                      type="color"
                      value={variant.colorHex || "#999999"}
                      onChange={(e) =>
                        handleColorHexChange(variantIndex, e.target.value)
                      }
                      style={{ width: "28px", height: "28px", padding: 0, border: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeColorVariant(variantIndex)}
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className={styles.sizesGrid}>
                  {sizesEntries.map(([sizeKey, qty]) => (
                    <label key={sizeKey} className={styles.sizePill}>
                      <strong>{sizeKey}</strong>
                      <span className={styles.sizeSeparator}>•</span>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) =>
                          handleVariantQtyChange(variantIndex, sizeKey, e.target.value)
                        }
                        className={styles.sizeQtyInput}
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            className={styles.uploadBtn}
            onClick={addColorVariant}
          >
            ➕ הוסף פילוח לפי צבע
          </button>
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

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setUploadMode("file");
                stopCamera();
              }}
              style={{
                flex: 1,
                padding: "0.45rem 1.1rem",
                borderRadius: "9px",
                border: "1px solid",
                borderColor:
                  uploadMode === "file" ? "var(--gold)" : "var(--border)",
                background:
                  uploadMode === "file" ? "var(--gold-dim)" : "transparent",
                color: uploadMode === "file" ? "var(--gold)" : "var(--muted)",
                fontFamily: "Alef, sans-serif",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.82rem",
              }}
            >
              📁 קובץ
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadMode("camera");
                startCamera();
              }}
              style={{
                flex: 1,
                padding: "0.45rem 1.1rem",
                borderRadius: "9px",
                border: "1px solid",
                borderColor:
                  uploadMode === "camera" ? "var(--gold)" : "var(--border)",
                background:
                  uploadMode === "camera" ? "var(--gold-dim)" : "transparent",
                color:
                  uploadMode === "camera" ? "var(--gold)" : "var(--muted)",
                fontFamily: "Alef, sans-serif",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.82rem",
              }}
            >
              📸 מצלמה
            </button>
          </div>

          {uploadMode === "file" && (
            <div
              className={styles.imageUploadBox}
              onClick={() => !form.image && fileInputRef.current?.click()}
              style={{ cursor: form.image ? "default" : "pointer" }}
            >
              {form.image ? (
                <>
                  <img
                    src={form.image}
                    alt="תצוגה מקדימה"
                    className={styles.imagePreview}
                  />
                  <button
                    className={styles.removeImageBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChange("image", "");
                    }}
                  >
                    🗑️ הסר תמונה
                  </button>
                </>
              ) : (
                <div
                  style={{
                    color: "var(--text)",
                    fontWeight: 700,
                    fontSize: "1rem",
                    marginBottom: "0.3rem",
                  }}
                >
                  לחץ להעלאה
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
            </div>
          )}

          {uploadMode === "camera" && (
            <div
              style={{
                background: "#000",
                borderRadius: "14px",
                overflow: "hidden",
                position: "relative",
                aspectRatio: "4/3",
                border: "1px solid var(--border)",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: isCameraActive ? "block" : "none",
                }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {!isCameraActive && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#060a14",
                  }}
                >
                  <button
                    type="button"
                    onClick={startCamera}
                    style={{
                      background: "rgba(52,152,219,0.1)",
                      border: "1px solid rgba(52,152,219,0.25)",
                      color: "var(--blue)",
                      borderRadius: "12px",
                      padding: "0.72rem 1.5rem",
                      fontFamily: "Alef, sans-serif",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    📷 פתח מצלמה
                  </button>
                </div>
              )}

              {isCameraActive && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "52px",
                    height: "52px",
                    fontSize: "1.4rem",
                    cursor: "pointer",
                    boxShadow: "0 0 16px rgba(0,0,0,0.6)",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  📸
                </button>
              )}
            </div>
          )}
        </div>

        {error && <div className={styles.addError}>{error}</div>}

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginTop: "1rem",
            flexDirection: "row-reverse",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              height: "54px",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              background: "transparent",
              color: "var(--muted)",
              fontFamily: "Alef, sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            ביטול
          </button>

          <button
            className={styles.addSubmitBtn}
            style={{ flex: 2 }}
            onClick={handleSubmit}
          >
            הוסף מוצר
          </button>
        </div>

        <ScanModal
          open={isScanOpen}
          onClose={() => setIsScanOpen(false)}
          onCodeScanned={(code) => {
            handleChange("code", code);
            setIsScanOpen(false);
          }}
        />
      </div>
    </div>
  );
}