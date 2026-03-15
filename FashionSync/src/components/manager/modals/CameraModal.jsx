import styles from "../../../styles/Manager.module.scss";

export default function CameraModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={`${styles.modalOv} ${styles.open}`} onClick={onClose}>
      <div
        className={styles.modalBox}
        style={{ width: "500px", textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.modalClose} onClick={onClose}>
          ✕
        </button>

        <div className={styles.modalTitle}>📸 צילום תמונה</div>

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
        ></video>

        <div
          style={{
            display: "flex",
            gap: "0.7rem",
            marginTop: "0.95rem",
            justifyContent: "center",
          }}
        >
          <button
            className={styles.btnGold}
            style={{ padding: "0.72rem 1.7rem", fontSize: "0.92rem" }}
          >
            📸 צלם
          </button>

          <button className={styles.btnGhost} onClick={onClose}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}