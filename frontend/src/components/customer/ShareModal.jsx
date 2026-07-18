import modalStyles from "../../styles/customer/CustomerModals.module.scss";

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm5.8 14.16c-.24.68-1.4 1.3-1.93 1.38-.49.08-1.11.11-1.79-.11-.41-.13-.94-.31-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.15-1.53-1.15-2.92s.72-2.07.98-2.35c.26-.28.56-.35.75-.35s.38 0 .54.01c.18.01.41-.07.64.49.24.58.81 2 .88 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.18-.28.36-.23.6-.14.25.09 1.58.75 1.85.88.28.14.46.21.53.32.07.12.07.68-.17 1.36z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 6l10 7 10-7" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
      <path d="M9 17H7a5 5 0 010-10h2" />
      <path d="M15 7h2a5 5 0 010 10h-2" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export default function ShareModal({
  open = false,
  shareItemName = "",
  copied = false,
  closeShareModal,
  doShare,
}) {
  return (
    <div
      className={`${modalStyles.modalWrap} ${open ? modalStyles.open : ""}`}
      id="share-modal"
    >
      <div className={modalStyles.modalBox} style={{ width: "460px" }}>
        <button className={modalStyles.modalClose} onClick={closeShareModal}>
          ✕
        </button>

        <div
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: "1.3rem",
            color: "var(--gold)",
            marginBottom: "0.5rem",
          }}
        >
          📤 שתף פריט
        </div>

        <div
          id="share-item-name"
          style={{ color: "var(--light-gray)", marginBottom: "0.5rem" }}
        >
          {shareItemName}
        </div>

        <div className={modalStyles.shareOptions}>
          <button className={modalStyles.shareOpt} onClick={() => doShare("whatsapp")}>
            <span className="icon"><WhatsAppIcon /></span>
            WhatsApp
          </button>

          <button className={modalStyles.shareOpt} onClick={() => doShare("email")}>
            <span className="icon"><EmailIcon /></span>
            אימייל
          </button>

          <button className={modalStyles.shareOpt} onClick={() => doShare("copy")}>
            <span className="icon"><LinkIcon /></span>
            העתק קישור
          </button>
        </div>

        {copied && (
          <div
            id="share-copied"
            style={{
              color: "var(--green)",
              textAlign: "center",
              marginTop: "0.75rem",
              fontSize: "0.9rem",
            }}
          >
            ✅ הקישור הועתק!
          </div>
        )}
      </div>
    </div>
  );
}