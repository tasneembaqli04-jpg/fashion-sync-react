import { useState, useEffect, useRef } from "react";
import modalStyles from "../../../styles/manager/ManagerModals.module.scss";
import { useDialog } from "../../common/DialogProvider";

export default function ManagerScanModal({
  isOpen,
  onClose,
  onApplyCode,
  scanTarget,
}) {
  const { alertDialog } = useDialog();
  const [manualCode, setManualCode] = useState("");
  const [scanMode, setScanMode] = useState("camera");
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startScanner = async () => {
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      alertDialog("שגיאה בגישה למצלמה");
      setScanMode("manual");
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen && scanMode === "camera") {
      startScanner();
    } else {
      stopScanner();
    }

    return stopScanner;
  }, [isOpen, scanMode]);

  const handleApply = () => {
    if (!manualCode.trim()) return;
    onApplyCode(manualCode.trim(), scanTarget);
    setManualCode("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={modalStyles.modalOverlay}>
      <div className={modalStyles.modalBox} style={{ width: "450px" }}>
        <button className={modalStyles.modalClose} onClick={onClose}>
          ✕
        </button>

        <div className={modalStyles.modalTitle}>📷 סריקת ברקוד</div>

        {scanMode === "camera" && (
          <div className={modalStyles.cameraBox}>
            <video ref={videoRef} autoPlay muted />

            {!cameraReady && <div className={modalStyles.cameraLoading}>טוען מצלמה...</div>}

            <div className={modalStyles.scanFrame}></div>
          </div>
        )}

        {scanMode === "manual" && (
          <div style={{ marginTop: "1rem" }}>
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="FS-001"
              className={modalStyles.scanInput}
            />

            <button className={modalStyles.scanBtn} onClick={handleApply}>
              חפש
            </button>
          </div>
        )}
      </div>
    </div>
  );
}