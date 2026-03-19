import { useState, useEffect, useRef } from "react";
import styles from "../../styles/employee/EmployeeModals.module.scss";
import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";

export default function NewProductModal({
  isOpen,
  onClose,
  onSave,
  onOpenScanner,
  scannedCode,
}) {
  const initialForm = {
    code: "",
    name: "",
    cat: "חולצות",
    gender: "נשים",
    season: "",
    qty: 0,
    price: 299,
    desc: "",
    img: "",
  };

  const [form, setForm] = useState(initialForm);
  const [uploadMode, setUploadMode] = useState("file");
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (scannedCode) {
      setForm((prev) => ({ ...prev, code: scannedCode }));
    }
  }, [scannedCode]);

  useEffect(() => {
    if (!isOpen) stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      alert("שגיאה בגישה למצלמה: וודא שנתת הרשאה בדפדפן.");
    }
  };

  
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [isCameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      handleChange("img", canvasRef.current.toDataURL("image/png"));
      stopCamera();
    }
  };

  if (!isOpen) return null;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleInternalSave() {
    if (!form.code) return alert("אנא הזן או סרוק קוד מוצר");
    if (!form.season) return alert("אנא בחר עונה");
    onSave(form);
    setForm(initialForm);
    stopCamera();
    onClose();
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  const optionStyle = { backgroundColor: "#2d2d2d", color: "#ffffff" };

  return (
    <div className={`${styles.newprodOverlay} ${styles.open}`}>
      <div
        className={styles.newprodBox}
        style={{
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        
        <div className={styles.newprodHeader} style={{ flexShrink: 0 }}>
          <div className={styles.newprodTitle}>
            <span style={{ color: "var(--purple)", marginLeft: "10px" }}>+</span>
            מוצר חדש
          </div>
          <button className={styles.newprodClose} onClick={handleClose}>✕</button>
        </div>

        
        <div style={{ overflowY: "auto", flex: 1 }}>
          <div className={layoutStyles.formGrid}>

            
            <div className={layoutStyles.formGroup}>
              <div className={layoutStyles.formLabel}>קוד</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  className={layoutStyles.formInput}
                  value={form.code}
                  placeholder="FS-XXX"
                  onChange={(e) => handleChange("code", e.target.value)}
                  style={{ direction: "ltr", flex: 1 }}
                />
               
                <button
                  type="button"
                  onClick={() => {
                    if (typeof onOpenScanner === "function") {
                      onOpenScanner("code");
                    }
                  }}
                  style={{
                    background: "#1e1e1e",
                    border: "1px solid #555",
                    borderRadius: "10px",
                    padding: "0 15px",
                    cursor: "pointer",
                    fontSize: "1.3rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "48px",
                    minHeight: "42px",
                  }}
                >
                  📷
                </button>
              </div>
            </div>

            <div className={layoutStyles.formGroup}>
              <div className={layoutStyles.formLabel}>שם</div>
              <input
                className={layoutStyles.formInput}
                value={form.name}
                placeholder="שם המוצר"
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className={layoutStyles.formGroup}>
              <div className={layoutStyles.formLabel}>עונה</div>
              <select
                className={layoutStyles.formInput}
                value={form.season}
                onChange={(e) => handleChange("season", e.target.value)}
                style={{ color: form.season ? "white" : "#999" }}
              >
                <option value="" disabled style={optionStyle}>בחר עונה...</option>
                <option value="all" style={optionStyle}>כל השנה</option>
                <option value="summer" style={optionStyle}>קיץ</option>
                <option value="winter" style={optionStyle}>חורף</option>
                <option value="spring-autumn" style={optionStyle}>אביב-סתיו</option>
              </select>
            </div>

            <div className={layoutStyles.formGroup}>
              <div className={layoutStyles.formLabel}>קטגוריה</div>
              <select
                className={layoutStyles.formInput}
                value={form.cat}
                onChange={(e) => handleChange("cat", e.target.value)}
              >
                <option style={optionStyle}>חולצות</option>
                <option style={optionStyle}>מכנסיים</option>
                <option style={optionStyle}>שמלות</option>
                <option style={optionStyle}>אביזרים</option>
              </select>
            </div>

            <div className={layoutStyles.formGroup}>
              <div className={layoutStyles.formLabel}>מגדר</div>
              <select
                className={layoutStyles.formInput}
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
              >
                <option style={optionStyle}>נשים</option>
                <option style={optionStyle}>גברים</option>
                <option style={optionStyle}>Unisex</option>
              </select>
            </div>

            <div className={layoutStyles.formGroup}>
              <div className={layoutStyles.formLabel}>מחיר (₪)</div>
              <input
                className={layoutStyles.formInput}
                type="number"
                value={form.price}
                onChange={(e) => handleChange("price", Number(e.target.value))}
              />
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

            <div className={`${layoutStyles.formGroup} ${layoutStyles.full}`}>
              <div className={layoutStyles.formLabel}>תיאור</div>
              <textarea
                className={layoutStyles.formInput}
                style={{ minHeight: "60px", resize: "none" }}
                placeholder="תיאור קצר..."
                value={form.desc}
                onChange={(e) => handleChange("desc", e.target.value)}
              />
            </div>

            {/* תמונת מוצר */}
            <div className={`${layoutStyles.formGroup} ${layoutStyles.full}`}>
              <div className={layoutStyles.formLabel}>תמונת מוצר</div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <button
                  type="button"
                  className={`${styles.uptBtn} ${uploadMode === "file" ? styles.active : ""}`}
                  onClick={() => { setUploadMode("file"); stopCamera(); }}
                >
                  📁 קובץ
                </button>
                <button
                  type="button"
                  className={`${styles.uptBtn} ${uploadMode === "camera" ? styles.active : ""}`}
                  onClick={() => setUploadMode("camera")}
                >
                  📸 מצלמה
                </button>
              </div>

              {uploadMode === "file" ? (
                <div
                  style={{
                    border: "2px dashed #444",
                    borderRadius: "8px",
                    padding: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  {form.img ? (
                    <span style={{ color: "var(--gold)" }}>תמונה מוכנה ✅</span>
                  ) : "לחץ להעלאה"}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ opacity: 0, position: "absolute", inset: 0, cursor: "pointer" }}
                    onChange={(e) => handleChange("img", e.target.files[0]?.name)}
                  />
                </div>
              ) : (
                <div
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid #333",
                    borderRadius: "12px",
                    height: "200px",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                    <button
                      type="button"
                      onClick={startCamera}
                      className={layoutStyles.btnBlue}
                      style={{ padding: "10px 20px", zIndex: 2 }}
                    >
                      פתח מצלמה
                    </button>
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
                        background: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        cursor: "pointer",
                        fontSize: "1.3rem",
                        boxShadow: "0 0 12px rgba(0,0,0,0.6)",
                        zIndex: 2,
                      }}
                    >
                      📸
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            gap: "12px",
            marginTop: "15px",
            borderTop: "1px solid #333",
            paddingTop: "15px",
            flexShrink: 0,
          }}
        >
          <button
            className={`${layoutStyles.btn} ${layoutStyles.btnGold}`}
            style={{ flex: 2, padding: "14px" }}
            onClick={handleInternalSave}
          >
            הוסף מוצר
          </button>
          <button
            className={`${layoutStyles.btn} ${layoutStyles.btnOutline}`}
            style={{ flex: 1, padding: "14px" }}
            onClick={handleClose}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}