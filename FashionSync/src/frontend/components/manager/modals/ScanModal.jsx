import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import modalStyles from "../../../styles/manager/ManagerModals.module.scss";

export default function ScanModal({ open, onClose, onCodeScanned }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const pausedRef = useRef(false);
  const animFrameRef = useRef(null);
  const devicesRef = useRef([]);
  const camIdxRef = useRef(0);

  const [mode, setMode] = useState("cam");
  const [camStatus, setCamStatus] = useState("🔍 מחפש ברקוד...");
  const [manualInput, setManualInput] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!open) {
      stopAll();
      setMode("cam");
      setManualInput("");
      setScanning(false);
      pausedRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (mode === "cam") startCamera();
    }, 100);

    return () => clearTimeout(timer);
  }, [open, mode]);

  function stopAll() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function startCamera() {
    stopAll();
    pausedRef.current = false;
    setCamStatus("🔍 מאתחל מצלמה...");

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      devicesRef.current = devices.filter((d) => d.kind === "videoinput");

      const deviceId =
        devicesRef.current[
          camIdxRef.current % Math.max(devicesRef.current.length, 1)
        ]?.deviceId;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            setCamStatus("🔍 מחפש ברקוד...");
            if ("BarcodeDetector" in window) startAutoScan();
          } catch (e) {
            setCamStatus("⚠️ שגיאה בהפעלת וידאו");
          }
        };
      }
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setCamStatus("⚠️ יש לאשר גישה למצלמה");
      } else {
        setCamStatus("⚠️ " + (err.message || err.name));
      }
    }
  }

  function startAutoScan() {
    async function frame() {
      if (!videoRef.current || !canvasRef.current || pausedRef.current) return;

      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

      try {
        const detector = new window.BarcodeDetector({
          formats: [
            "code_128",
            "code_39",
            "code_93",
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "qr_code",
          ],
        });

        const barcodes = await detector.detect(canvas);

        if (barcodes.length > 0 && !pausedRef.current) {
          handleScanned(barcodes[0].rawValue);
          return;
        }
      } catch (e) {}

      animFrameRef.current = requestAnimationFrame(frame);
    }

    animFrameRef.current = requestAnimationFrame(frame);
  }

  async function doManualCapture() {
    if (!videoRef.current || !canvasRef.current || pausedRef.current) return;

    setScanning(true);
    setCamStatus("🔍 סורק...");

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    if ("BarcodeDetector" in window) {
      try {
        const detector = new window.BarcodeDetector({
          formats: [
            "code_128",
            "code_39",
            "code_93",
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "qr_code",
          ],
        });

        const barcodes = await detector.detect(canvas);
        if (barcodes.length > 0) {
          handleScanned(barcodes[0].rawValue);
          return;
        }
      } catch (e) {}
    }

    if (window.ZXing) {
      try {
        const reader = new window.ZXing.BrowserMultiFormatReader();
        const img = new Image();
        img.src = canvas.toDataURL("image/png");
        await new Promise((res) => {
          img.onload = res;
        });
        const result = await reader.decodeFromImageElement(img);
        if (result) {
          handleScanned(result.getText());
          return;
        }
      } catch (e) {}
    }

    setCamStatus("❌ לא זוהה — נסה שוב");
    setScanning(false);
  }

  function handleScanned(code) {
    pausedRef.current = true;
    stopAll();
    if (onCodeScanned) onCodeScanned(code);
    onClose();
  }

  async function switchCamera() {
    camIdxRef.current =
      (camIdxRef.current + 1) % Math.max(devicesRef.current.length, 1);
    await startCamera();
  }

  async function toggleTorch() {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (e) {}
  }

  function handleManualSubmit() {
    const code = manualInput.trim();
    if (!code) return;
    handleScanned(code);
  }

  function switchMode(m) {
    setMode(m);
    if (m === "manual") stopAll();
  }

  if (!open) return null;

  return createPortal(
    <div
      className={modalStyles.modalOverlay}
      onClick={() => {
        stopAll();
        onClose();
      }}
    >
      <div
        className={modalStyles.modalBox}
        style={{
          width: "100%",
          maxWidth: "480px",
          direction: "rtl",
          animation: "fadeUp 0.28s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            stopAll();
            onClose();
          }}
          className={modalStyles.modalClose}
        >
          ✕
        </button>

        <div
          className={modalStyles.modalTitle}
          style={{ marginBottom: "0.3rem", textAlign: "right" }}
        >
          סריקת ברקוד 📷
        </div>

        <p
          style={{
            color: "var(--muted, #5c6170)",
            fontSize: "0.8rem",
            marginBottom: "0.85rem",
            textAlign: "right",
          }}
        >
          סרוק ברקוד לעדכון מלאי
        </p>

        <div
          style={{
            display: "flex",
            gap: "0.42rem",
            marginBottom: "0.95rem",
          }}
        >
          <button
            onClick={() => switchMode("cam")}
            style={{
              flex: 1,
              padding: "0.52rem",
              borderRadius: "8px",
              background:
                mode === "cam"
                  ? "rgba(201,168,76,0.1)"
                  : "var(--surface3, #1c1e28)",
              border:
                mode === "cam"
                  ? "1px solid rgba(201,168,76,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
              fontFamily: "Alef, sans-serif",
              fontSize: "0.76rem",
              color:
                mode === "cam"
                  ? "var(--gold, #c9a84c)"
                  : "var(--muted, #5c6170)",
              fontWeight: mode === "cam" ? 700 : 400,
            }}
          >
            📹 מצלמה
          </button>

          <button
            onClick={() => switchMode("manual")}
            style={{
              flex: 1,
              padding: "0.52rem",
              borderRadius: "8px",
              background:
                mode === "manual"
                  ? "rgba(201,168,76,0.1)"
                  : "var(--surface3, #1c1e28)",
              border:
                mode === "manual"
                  ? "1px solid rgba(201,168,76,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
              fontFamily: "Alef, sans-serif",
              fontSize: "0.76rem",
              color:
                mode === "manual"
                  ? "var(--gold, #c9a84c)"
                  : "var(--muted, #5c6170)",
              fontWeight: mode === "manual" ? 700 : 400,
            }}
          >
            ⌨️ ידנית
          </button>
        </div>

        {mode === "cam" && (
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "4/3",
              background: "#000",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "0.85rem",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "70%",
                  aspectRatio: "3/1",
                  border: "2px solid var(--gold, #c9a84c)",
                  borderRadius: "8px",
                }}
              />

              <style>{`
                @keyframes scanLine {
                  0%   { top: 35%; }
                  50%  { top: 65%; }
                  100% { top: 35%; }
                }
              `}</style>

              <div
                style={{
                  position: "absolute",
                  left: "15%",
                  right: "15%",
                  height: "2px",
                  background:
                    "linear-gradient(90deg, transparent, #e74c3c, transparent)",
                  animation: "scanLine 1.8s ease-in-out infinite",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  bottom: "70px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(0,0,0,0.72)",
                  color: "var(--muted, #5c6170)",
                  fontSize: "0.68rem",
                  padding: "0.2rem 0.75rem",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                }}
              >
                {camStatus}
              </div>
            </div>

            <button
              onClick={doManualCapture}
              disabled={scanning}
              style={{
                position: "absolute",
                bottom: "14px",
                left: "50%",
                transform: "translateX(-50%)",
                background: scanning
                  ? "rgba(201,168,76,0.5)"
                  : "linear-gradient(135deg, #c9a84c, #e8c97a)",
                color: "#07080c",
                border: "none",
                borderRadius: "25px",
                padding: "0.65rem 2rem",
                fontFamily: "Alef, sans-serif",
                fontWeight: 700,
                fontSize: "0.92rem",
                cursor: scanning ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                zIndex: 10,
                whiteSpace: "nowrap",
              }}
            >
              {scanning ? "⏳ סורק..." : "לחץ לסריקה"}
            </button>
          </div>
        )}

        {mode === "manual" && (
          <div style={{ marginBottom: "0.85rem" }}>
            <div
              style={{
                fontSize: "0.78rem",
                color: "var(--muted)",
                marginBottom: "0.5rem",
                textAlign: "right",
              }}
            >
              הכנס קוד מוצר ידנית:
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="לדוגמה: FS-001"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualSubmit();
                }}
                autoFocus
                style={{
                  flex: 1,
                  background: "var(--bg, #07080c)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "9px",
                  padding: "0.68rem 1rem",
                  color: "var(--text, #eaeaf0)",
                  fontFamily: "Alef, sans-serif",
                  fontSize: "0.86rem",
                  outline: "none",
                }}
              />

              <button
                onClick={handleManualSubmit}
                style={{
                  background: "linear-gradient(135deg, #c9a84c, #e8c97a)",
                  color: "#07080c",
                  border: "none",
                  borderRadius: "9px",
                  padding: "0 1.2rem",
                  fontFamily: "Alef, sans-serif",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                חפש
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}