import modalStyles from "../../styles/customer/CustomerModals.module.scss";

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
            <span className="icon">WhatsApp</span>
            WhatsApp
          </button>

          <button className={modalStyles.shareOpt} onClick={() => doShare("email")}>
            <span className="icon">✉️</span>
            אימייל
          </button>

          <button className={modalStyles.shareOpt} onClick={() => doShare("copy")}>
            <span className="icon">🔗</span>
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