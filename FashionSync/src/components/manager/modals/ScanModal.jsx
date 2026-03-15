import styles from "../../../styles/Manager.module.scss";

export default function ScanModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={`${styles.modalOv} ${styles.open}`} onClick={onClose}>
      <div className={styles.modalBox} style={{ width: "520px" }} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          ✕
        </button>

        <div className={styles.modalTitle}>📷 סריקת ברקוד</div>

        <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.85rem" }}>
          סרוק ברקוד לחיפוש מוצר מהיר
        </p>

        <div className={styles.scanModeTabs}>
          <button className={`${styles.scanMtab} ${styles.active}`}>📹 מצלמה</button>
          <button className={styles.scanMtab}>⌨️ ידנית</button>
        </div>

        <div>
          <div className={styles.camViewport}>
            <video autoPlay muted playsInline></video>
            <div className={styles.camOverlay}>
              <div className={styles.camFrame}></div>
              <div className={styles.camScanLine}></div>
              <div className={styles.camStatus}>🔍 מחפש ברקוד...</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem" }}>
            <button className={styles.btnGhost} style={{ flex: 1, fontSize: "0.76rem" }}>
              🔄 החלף מצלמה
            </button>
            <button className={styles.btnGhost} style={{ flex: 1, fontSize: "0.76rem" }}>
              🔦 פנס
            </button>
          </div>
        </div>

        <div className={styles.scanResultInline}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <img
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "8px",
                objectFit: "cover",
                flexShrink: 0,
              }}
              src=""
              alt=""
            />
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>—</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.14rem" }}>
                —
              </div>
            </div>
            <span className={`${styles.tag} ${styles.tGreen}`}>נמצא ✓</span>
          </div>
        </div>

        <button className={styles.btnGhost} style={{ width: "100%" }} onClick={onClose}>
          סגור ✕
        </button>
      </div>
    </div>
  );
}