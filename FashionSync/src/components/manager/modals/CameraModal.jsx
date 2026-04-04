import modalStyles from "../../styles/manager/ManagerModals.module.scss";
import uiStyles from "../../styles/manager/ManagerUI.module.scss";

export default function CameraModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div
        className={modalStyles.modalBox}
        style={{ width: "500px", textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={modalStyles.modalClose} onClick={onClose}>
          ✕
        </button>

        <div className={modalStyles.modalTitle}>📸 צילום תמונה</div>

        <video
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            borderRadius: "10px",
            background: "#000",
            maxHeight: "300px",
            objectFit: "cover",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: "0.7rem",
            marginTop: "0.95rem",
            justifyContent: "center",
          }}
        >
          <button
            className={`${uiStyles.btn} ${uiStyles.btnGold}`}
            style={{ padding: "0.72rem 1.7rem", fontSize: "0.92rem" }}
          >
            📸 צלם
          </button>

          <button
            className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
            onClick={onClose}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}