import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";

export default function VisualSearchModal({
  open = false,
  tryonSelfie = "",
  closeVisualModal,
  tryOnSelfieUpload,
  clearTryonSelfie,
}) {
  const handleSaveImage = () => {
    if (!tryonSelfie) return;

    const link = document.createElement("a");
    link.href = tryonSelfie;
    link.download = "fashionsync-tryon-result.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareImage = async () => {
    if (!tryonSelfie) return;

    try {
      const response = await fetch(tryonSelfie);
      const blob = await response.blob();
      const file = new File([blob], "fashionsync-tryon.png", {
        type: blob.type || "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "FashionSync - נסה עליי",
          text: "שיתוף תמונת נסה עליי",
          files: [file],
        });
        return;
      }

      const link = document.createElement("a");
      link.href = tryonSelfie;
      link.download = "fashionsync-tryon.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("הדפדפן לא תומך בשיתוף ישיר, לכן התמונה נשמרה למחשב.");
    } catch (error) {
      console.error("Share failed:", error);
      alert("השיתוף לא נתמך בדפדפן הזה.");
    }
  };

  return (
    <div
      className={`${modalStyles.modalWrap} ${open ? modalStyles.open : ""}`}
      id="visual-modal"
    >
      <div className={modalStyles.modalBox}>
        <button className={modalStyles.modalClose} onClick={closeVisualModal}>
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
            📸 נסה עליי
          </div>
        </div>

        <div className={modalStyles.vsLayout}>
          <div className={modalStyles.card}>
            <div className={baseStyles.secTitle}>🤳 העלאת תמונה</div>

            {!tryonSelfie ? (
              <div className={modalStyles.uploadDrop}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={tryOnSelfieUpload}
                />
                <div className={modalStyles.uploadIcon}>📸</div>
                <div className={modalStyles.uploadText}>העלה תמונה שלך</div>
              </div>
            ) : (
              <div style={{ marginTop: "1rem" }}>
                <img
                  src={tryonSelfie}
                  alt="תמונה שהועלתה"
                  style={{
                    width: "100%",
                    height: "420px",
                    borderRadius: "14px",
                    objectFit: "cover",
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
                  <label
                    className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
                    style={{ cursor: "pointer" }}
                  >
                    🔁 החלף תמונה
                    <input
                      type="file"
                      accept="image/*"
                      onChange={tryOnSelfieUpload}
                      style={{ display: "none" }}
                    />
                  </label>

                  <button
                    className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
                    onClick={clearTryonSelfie}
                  >
                    🗑️ מחק תמונה
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={modalStyles.card}>
            <div className={baseStyles.secTitle}>🪞 התוצאה</div>

            <div
              style={{
                color: "var(--light-gray)",
                textAlign: "center",
                padding: "1.2rem",
              }}
            >
              {tryonSelfie ? (
                <>
                  <img
                    src={tryonSelfie}
                    alt="תוצאה"
                    style={{
                      width: "100%",
                      height: "420px",
                      borderRadius: "14px",
                      objectFit: "cover",
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
                      className={`${baseStyles.btn} ${baseStyles.btnGold}`}
                      onClick={handleSaveImage}
                    >
                      💾 שמור תמונה
                    </button>

                    <button
                      className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
                      onClick={handleShareImage}
                    >
                      🔗 שתף
                    </button>
                  </div>
                </>
              ) : (
                "העלה תמונה כדי לראות תוצאה"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}