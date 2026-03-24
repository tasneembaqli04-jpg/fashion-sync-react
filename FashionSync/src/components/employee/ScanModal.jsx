import { useState, useEffect, useRef } from "react";
import modalStyles from "../../styles/employee/EmployeeModals.module.scss";
import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";
import sellStyles from "../../styles/employee/EmployeeSell.module.scss";

export default function ScanModal({
  isOpen,
  onClose,
  onApplyCode,
  scanTarget,
}) {
  const [manualCode, setManualCode] = useState("");
  const [scanMode, setScanMode] = useState("camera");
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startScanner = async () => {
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            .play()
            .then(() => setCameraReady(true))
            .catch((err) => console.error("Play error:", err));
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("שגיאה בגישה למצלמה: וודא שנתת הרשאה בדפדפן.");
      setScanMode("manual");
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  useEffect(() => {
    if (isOpen && scanMode === "camera") {
      const timer = setTimeout(() => startScanner(), 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, scanMode]);

  const handleApply = (codeValue) => {
    const finalCode = codeValue || manualCode;
    if (!finalCode.trim()) return;
    onApplyCode(finalCode.trim(), scanTarget);
    setManualCode("");
    stopScanner();
    onClose();
  };

  const handleClose = () => {
    stopScanner();
    setScanMode("camera");
    onClose();
  };

  return (
    <div
      className={modalStyles.scanOverlay}
      style={{ display: isOpen ? "flex" : "none" }}
    >
      <div
        className={modalStyles.modalBox}
        style={{
          width: "450px",
          borderRadius: "24px",
          padding: "24px",
          position: "relative",
        }} 
      >
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "rgba(255,255,255,0.05)",
            border: "none",
            color: "#888",
            fontSize: "1.2rem",
            cursor: "pointer",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
        >
          ✕
        </button>
        <h2 style={{ color: "white", marginBottom: "5px", textAlign: "right" }}>
          📷 סריקת ברקוד
        </h2>
        <p style={{ color: "#aaa", marginBottom: "20px", textAlign: "right" }}>
          {scanTarget === "sell"
            ? "סרוק ברקוד פריט למכירה"
            : "סרוק ברקוד לעדכון מלאי"}
        </p>

        <div
          style={{
            display: "flex",
            background: "#1e1e1e",
            borderRadius: "12px",
            padding: "5px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => setScanMode("camera")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: scanMode === "camera" ? "#2d2d2d" : "transparent",
              color: "white",
              cursor: "pointer",
              fontWeight: scanMode === "camera" ? "bold" : "normal",
            }}
          >
            📹 מצלמה
          </button>
          <button
            onClick={() => setScanMode("manual")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: scanMode === "manual" ? "#3d2e1e" : "transparent",
              color: scanMode === "manual" ? "#e1b16a" : "white",
              cursor: "pointer",
              fontWeight: scanMode === "manual" ? "bold" : "normal",
            }}
          >
            ⌨️ ידנית
          </button>
        </div>

        <div style={{ display: scanMode === "camera" ? "block" : "none" }}>
          <div
            style={{
              position: "relative",
              borderRadius: "15px",
              overflow: "hidden",
              height: "250px",
              background: "#000",
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            <div className={modalStyles.scannerOverlay}>
              <div className={modalStyles.targetFrame}></div>
              <div className={modalStyles.scannerLine}></div>
            </div>

            {!cameraReady && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#000",
                  color: "#888",
                  fontSize: "0.9rem",
                }}
              >
                טוען מצלמה...
              </div>
            )}

            {cameraReady && (
              <button
                style={{
                  position: "absolute",
                  bottom: "15px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "8px 24px",
                  background: "#e1b16a",
                  border: "none",
                  borderRadius: "10px",
                  color: "#000",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                }}
                onClick={() =>
                  handleApply("FS-" + Math.floor(100 + Math.random() * 900))
                }
              >
                לחץ לסריקה
              </button>
            )}
          </div>
        </div>

        {scanMode === "manual" && (
          <div style={{ padding: "10px 0" }}>
            <label
              style={{
                display: "block",
                color: "#888",
                marginBottom: "10px",
                fontSize: "0.9rem",
                textAlign: "right",
              }}
            >
              הכנס קוד מוצר ידנית:
            </label>
            <div style={{ display: "flex", gap: "0.55rem" }}>
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                placeholder="לדוגמה: FS-001"
                autoFocus
                style={{
                  flex: 1,
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  color: "white",
                  padding: "12px",
                  borderRadius: "10px",
                  textAlign: "right",
                  direction: "rtl",
                  outline: "none",
                  fontSize: "1rem",
                }}
              />
              <button
                onClick={() => handleApply()}
                style={{
                  padding: "0 25px",
                  background: "#e1b16a",
                  border: "none",
                  borderRadius: "10px",
                  color: "#000",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                חפש
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
