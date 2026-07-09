import commonStyles from "../../styles/customer/Customer.module.scss";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";

export default function CustomerGiftCard({
  show,
  giftAmount,
  giftCustomAmount,
  giftName,
  giftMessage,
  giftPreviewCode,
  giftError,
  handleGcAmountChange,
  buyGiftCard,
  setGiftCustomAmount,
  setGiftName,
  setGiftMessage,
  giftCheckCode,
  setGiftCheckCode,
  giftCheckResult,
  giftCheckError,
  checkGiftCardBalance,
}) {
  if (!show) return null;

  const previewAmount =
    giftAmount === "other" ? giftCustomAmount || "?" : giftAmount;

  return (
    <div>
      <div className={commonStyles.pageTitle}>🎁 כרטיס מתנה</div>
      <div className={commonStyles.pageSub}>שלח מתנה לאהובים שלך</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <div>
          <div className={commonStyles.secTitle}>צור כרטיס מתנה</div>

          <div className={modalStyles.pdField} style={{ marginBottom: "0.75rem" }}>
            <label>סכום</label>
            <select
              value={giftAmount}
              onChange={(e) => handleGcAmountChange(e.target.value)}
            >
              <option value="100">₪100</option>
              <option value="200">₪200</option>
              <option value="300">₪300</option>
              <option value="500">₪500</option>
              <option value="other">אחר...</option>
            </select>

            {giftAmount === "other" && (
              <input
                type="number"
                placeholder="הזן סכום..."
                min="10"
                value={giftCustomAmount}
                onChange={(e) => setGiftCustomAmount(e.target.value)}
                style={{ marginTop: "0.5rem" }}
              />
            )}
          </div>

          <div className={modalStyles.pdField} style={{ marginBottom: "0.75rem" }}>
            <label>שם המקבל</label>
            <input
              type="text"
              placeholder="שם..."
              value={giftName}
              onChange={(e) => setGiftName(e.target.value)}
            />
          </div>

          <div className={modalStyles.pdField} style={{ marginBottom: "1rem" }}>
            <label>הודעה אישית</label>
            <input
              type="text"
              placeholder="ברכה..."
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
            />
          </div>

          <button
            className={`${commonStyles.btn} ${commonStyles.btnGold}`}
            onClick={buyGiftCard}
          >
            🎁 רכוש כרטיס מתנה
          </button>

          {giftError && (
            <div
              style={{
                marginTop: "0.75rem",
                color: "#ffb3b3",
                background: "rgba(192, 57, 43, 0.08)",
                border: "1px solid rgba(192, 57, 43, 0.25)",
                borderRadius: "10px",
                padding: "0.7rem 0.9rem",
                fontSize: "0.85rem",
              }}
            >
              {giftError}
            </div>
          )}
        </div>

        <div>
          <div className={commonStyles.secTitle}>תצוגה מקדימה</div>

          <div className={modalStyles.giftCardDisplay}>
            <div className={modalStyles.giftCardLogo}>FashionSync</div>

            <div
              style={{
                color: "var(--light-gray)",
                fontSize: "0.83rem",
                marginBottom: "0.5rem",
              }}
            >
              כרטיס מתנה
            </div>

            <div className={modalStyles.giftCardAmount}>₪{previewAmount}</div>

            <div
              style={{
                color: "var(--light-gray)",
                fontSize: "0.8rem",
                marginTop: "0.6rem",
              }}
            >
              עבור: {giftName || "—"}
            </div>

            <div
              style={{
                color: "var(--light-gray)",
                fontSize: "0.78rem",
                marginTop: "0.3rem",
                fontStyle: "italic",
              }}
            >
              {giftMessage ? `"${giftMessage}"` : ""}
            </div>

            <div className={modalStyles.giftCardCode}>
              {giftPreviewCode || "—"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <div className={commonStyles.secTitle}>💳 בדיקת יתרה בכרטיס מתנה</div>

        <div style={{ display: "flex", gap: "0.6rem", maxWidth: "420px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="הזן/י קוד כרטיס מתנה (GC-...)"
            value={giftCheckCode}
            onChange={(e) => setGiftCheckCode(e.target.value)}
            style={{ flex: 1, minWidth: "200px" }}
          />
          <button
            className={`${commonStyles.btn} ${commonStyles.btnOutline}`}
            onClick={checkGiftCardBalance}
          >
            בדוק יתרה
          </button>
        </div>

        {giftCheckError && (
          <div style={{ color: "#ffb3b3", marginTop: "0.6rem", fontSize: "0.85rem" }}>
            {giftCheckError}
          </div>
        )}

        {giftCheckResult && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.9rem",
              borderRadius: "10px",
              border: "1px solid rgba(201,168,76,.3)",
              background: "rgba(201,168,76,.06)",
              maxWidth: "420px",
            }}
          >
            <div>יתרה נוכחית: <strong>₪{giftCheckResult.balance}</strong> מתוך ₪{giftCheckResult.amount}</div>
            <div style={{ opacity: 0.7, fontSize: "0.85rem", marginTop: "0.3rem" }}>
              סטטוס: {giftCheckResult.status === "used" ? "נוצל במלואו" : "פעיל"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}