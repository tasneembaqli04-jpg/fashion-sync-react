import commonStyles from "../../styles/customer/Customer.module.scss";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

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
  const { t: dict } = useLanguage();
  const t = dict.customer.giftCard;

  if (!show) return null;

  const previewAmount =
    giftAmount === "other" ? giftCustomAmount || "?" : giftAmount;

  return (
    <div>
      <div className={commonStyles.pageTitle}>{t.title}</div>
      <div className={commonStyles.pageSub}>{t.subtitle}</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <div>
          <div className={commonStyles.secTitle}>{t.createTitle}</div>

          <div className={modalStyles.pdField} style={{ marginBottom: "0.75rem" }}>
            <label>{t.amountLabel}</label>
            <select
              value={giftAmount}
              onChange={(e) => handleGcAmountChange(e.target.value)}
            >
              <option value="100">₪100</option>
              <option value="200">₪200</option>
              <option value="300">₪300</option>
              <option value="500">₪500</option>
              <option value="other">{t.otherAmount}</option>
            </select>

            {giftAmount === "other" && (
              <input
                type="number"
                placeholder={t.enterAmountPlaceholder}
                min="10"
                value={giftCustomAmount}
                onChange={(e) => setGiftCustomAmount(e.target.value)}
                style={{ marginTop: "0.5rem" }}
              />
            )}
          </div>

          <div className={modalStyles.pdField} style={{ marginBottom: "0.75rem" }}>
            <label>{t.recipientNameLabel}</label>
            <input
              type="text"
              placeholder={t.namePlaceholder}
              value={giftName}
              onChange={(e) => setGiftName(e.target.value)}
            />
          </div>

          <div className={modalStyles.pdField} style={{ marginBottom: "1rem" }}>
            <label>{t.personalMessageLabel}</label>
            <input
              type="text"
              placeholder={t.messagePlaceholder}
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
            />
          </div>

          <button
            className={`${commonStyles.btn} ${commonStyles.btnGold}`}
            onClick={buyGiftCard}
          >
            {t.buyButton}
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
          <div className={commonStyles.secTitle}>{t.previewTitle}</div>

          <div className={modalStyles.giftCardDisplay}>
            <div className={modalStyles.giftCardLogo}>FashionSync</div>

            <div
              style={{
                color: "var(--light-gray)",
                fontSize: "0.83rem",
                marginBottom: "0.5rem",
              }}
            >
              {t.giftCardLabel}
            </div>

            <div className={modalStyles.giftCardAmount}>₪{previewAmount}</div>

            <div
              style={{
                color: "var(--light-gray)",
                fontSize: "0.8rem",
                marginTop: "0.6rem",
              }}
            >
              {t.forLabel} {giftName || "—"}
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
        <div className={commonStyles.secTitle}>{t.checkBalanceTitle}</div>

        <div style={{ display: "flex", gap: "0.6rem", maxWidth: "420px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder={t.checkCodePlaceholder}
            value={giftCheckCode}
            onChange={(e) => setGiftCheckCode(e.target.value)}
            style={{ flex: 1, minWidth: "200px" }}
          />
          <button
            className={`${commonStyles.btn} ${commonStyles.btnOutline}`}
            onClick={checkGiftCardBalance}
          >
            {t.checkBalanceButton}
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
            <div>{t.currentBalance} <strong>₪{giftCheckResult.balance}</strong> {t.outOf} ₪{giftCheckResult.amount}</div>
            <div style={{ opacity: 0.7, fontSize: "0.85rem", marginTop: "0.3rem" }}>
              {t.statusLabel} {giftCheckResult.status === "used" ? t.statusUsed : t.statusActive}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}