import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";
import { useDialog } from "../common/DialogProvider";
import { useLanguage } from "../../translations/LanguageProvider";

export default function VisualSearchModal({
  open = false,
  tryonSelfie = "",
  tryOnResult = null,
  tryOnLoading = false,
  tryOnError = "",
  closeVisualModal,
  tryOnSelfieUpload,
  clearTryonSelfie,
  onTryOn,
}) {
  const { alertDialog } = useDialog();
  const { t: dict } = useLanguage();
  const t = dict.customer.tryOn;

  const resultImageUrl =
    tryOnResult?.resultImageUrl ||
    tryOnResult?.imageUrl ||
    (tryOnResult?.imageBase64
      ? `data:${tryOnResult.mimeType || "image/png"};base64,${
          tryOnResult.imageBase64
        }`
      : "");

  const handleSaveImage = () => {
    if (!resultImageUrl) return;

    const link = document.createElement("a");
    link.href = resultImageUrl;
    link.download = "fashionsync-tryon-result.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareImage = async () => {
    if (!resultImageUrl) return;

    try {
      const response = await fetch(resultImageUrl);
      const blob = await response.blob();

      const file = new File([blob], "fashionsync-tryon.png", {
        type: blob.type || "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: t.shareTitleNative,
          text: t.shareTextNative,
          files: [file],
        });

        return;
      }

      const link = document.createElement("a");
      link.href = resultImageUrl;
      link.download = "fashionsync-tryon.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alertDialog(dict.customer.dialogs.shareNotSupported);
    } catch (error) {
      console.error("Share failed:", error);
      alertDialog(dict.customer.dialogs.shareNotSupportedBrowser);
    }
  };

  if (!open) return null;

  return (
    <div
      className={`${modalStyles.modalWrap} ${modalStyles.open}`}
      id="visual-modal"
    >
      <div className={modalStyles.modalBox}>
        <button
          type="button"
          className={modalStyles.modalClose}
          onClick={closeVisualModal}
        >
          ✕
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "1.3rem",
              color: "var(--gold)",
            }}
          >
            {t.title}
          </div>
        </div>

        <div className={modalStyles.vsLayout}>
          <div className={modalStyles.card}>
            <div className={baseStyles.secTitle}>{t.uploadSectionTitle}</div>

            {!tryonSelfie ? (
              <div className={modalStyles.uploadDrop}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={tryOnSelfieUpload}
                />

                <div className={modalStyles.uploadIcon}>📸</div>
                <div className={modalStyles.uploadText}>{t.uploadText}</div>
              </div>
            ) : (
              <div style={{ marginTop: "1rem" }}>
                <img
                  src={tryonSelfie}
                  alt={t.uploadedAlt}
                  style={{
                    width: "100%",
                    height: "420px",
                    borderRadius: "14px",
                    border: "1px solid var(--border)",
                    display: "block",
                    objectFit: "contain",
                    objectPosition: "center",
                  }}
                />

                <div
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    gap: ".6rem",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <label
                    className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
                    style={{ cursor: "pointer" }}
                  >
                    {t.changeImage}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={tryOnSelfieUpload}
                      style={{ display: "none" }}
                    />
                  </label>

                  <button
                    type="button"
                    className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
                    onClick={clearTryonSelfie}
                    disabled={tryOnLoading}
                  >
                    {t.deleteImage}
                  </button>

                  <button
                    type="button"
                    className={`${baseStyles.btn} ${baseStyles.btnGold}`}
                    onClick={onTryOn}
                    disabled={tryOnLoading}
                  >
                    {tryOnLoading ? t.processingButton : t.activateButton}
                  </button>
                </div>

                {tryOnError && (
                  <div
                    style={{
                      marginTop: "1rem",
                      color: "#ff6b6b",
                      textAlign: "center",
                    }}
                  >
                    {tryOnError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={modalStyles.card}>
            <div className={baseStyles.secTitle}>{t.resultTitle}</div>

            <div
              style={{
                color: "var(--light-gray)",
                textAlign: "center",
                padding: "1.2rem",
              }}
            >
              {tryOnLoading ? (
                <div style={{ padding: "4rem 1rem" }}>
                  {t.generatingResult}
                </div>
              ) : resultImageUrl ? (
                <>
                  <img
                    src={resultImageUrl}
                    alt={t.resultAlt}
                    style={{
                      width: "100%",
                      height: "420px",
                      borderRadius: "14px",
                      objectFit: "contain",
                      objectPosition: "center",
                      border: "1px solid var(--border)",
                      display: "block",
                    }}
                  />

                  <div
                    style={{
                      marginTop: "1rem",
                      display: "flex",
                      gap: ".6rem",
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      type="button"
                      className={`${baseStyles.btn} ${baseStyles.btnGold}`}
                      onClick={handleSaveImage}
                    >
                      {t.saveImage}
                    </button>

                    <button
                      type="button"
                      className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
                      onClick={handleShareImage}
                    >
                      {t.shareImage}
                    </button>
                  </div>
                </>
              ) : (
                t.emptyResultPlaceholder
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}