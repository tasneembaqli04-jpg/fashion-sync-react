import styles from "../../styles/checkout/CheckoutPayment.module.scss";
import CheckoutPriceBox from "./CheckoutPriceBox";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CheckoutStep3Payment({
  payMethod = "card",
  setPayMethod,
  giftCardCode = "",
  setGiftCardCode,
  isGiftCardOnly = false,
  form,
  errors,
  onChange,
  installments = [],
  selectedInstallments = 1,
  onSelectInstallments,
  subtotal = 0,
  discount = 0,
  pointsDiscount = 0,
  shippingCost = 0,
  total = 0,
  termsAccepted = false,
  onToggleTerms,
  onBack,
  onPay,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.checkout.step3;
  const showInstallments = payMethod === "card" && total >= 100;

  return (
    <div className={styles.stepPanel}>
      <div className={styles.card}>
        <div className={styles.secTitle}>{t.paymentMethodTitle}</div>

        <div className={styles.payMethods}>
          <div
            className={`${styles.payOpt} ${payMethod === "card" ? styles.selected : ""}`}
            onClick={() => setPayMethod("card")}
            role="button"
            tabIndex={0}
          >
            <span className={styles.payIcon}>💳</span>
            {t.creditCard}
          </div>

          <div
            className={`${styles.payOpt} ${payMethod === "bit" ? styles.selected : ""}`}
            onClick={() => setPayMethod("bit")}
            role="button"
            tabIndex={0}
          >
            <span className={styles.payIcon}>📱</span>
            Bit
          </div>

          <div
            className={`${styles.payOpt} ${payMethod === "paypal" ? styles.selected : ""}`}
            onClick={() => setPayMethod("paypal")}
            role="button"
            tabIndex={0}
          >
            <span className={styles.payIcon}>🅿️</span>
            PayPal
          </div>

          {!isGiftCardOnly && (
            <div
              className={`${styles.payOpt} ${payMethod === "cash" ? styles.selected : ""}`}
              onClick={() => setPayMethod("cash")}
              role="button"
              tabIndex={0}
            >
              <span className={styles.payIcon}>💵</span>
              {t.cashOnPickup}
            </div>
          )}

          {!isGiftCardOnly && (
            <div
              className={`${styles.payOpt} ${payMethod === "giftcard" ? styles.selected : ""}`}
              onClick={() => setPayMethod("giftcard")}
              role="button"
              tabIndex={0}
            >
              <span className={styles.payIcon}>🎁</span>
              {t.giftCard}
            </div>
          )}
        </div>

        {payMethod === "card" && (
          <div>
            <div className={styles.fg}>
              <label htmlFor="f-cardnum">{t.cardNumber}</label>
              <div className={styles.cardNumWrap}>
                <input
                  id="f-cardnum"
                  name="cardNumber"
                  type="text"
                  value={form.cardNumber}
                  onChange={onChange}
                  maxLength={19}
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  className={errors.cardNumber ? styles.invalid : ""}
                />
                <span className={styles.cardBrandIcon}>💳</span>
              </div>
              {errors.cardNumber && (
                <div className={styles.fieldErr}>{t.invalidCardNumber}</div>
              )}
            </div>

            <div className={styles.fg}>
              <label htmlFor="f-cardholder">{t.cardHolder}</label>
              <input
                id="f-cardholder"
                name="cardHolder"
                type="text"
                value={form.cardHolder}
                onChange={onChange}
                className={errors.cardHolder ? styles.invalid : ""}
              />
              {errors.cardHolder && (
                <div className={styles.fieldErr}>{t.requiredField}</div>
              )}
            </div>

            <div className={styles.fg}>
              <label htmlFor="f-cardid">{t.cardHolderId}</label>
              <input
                id="f-cardid"
                name="cardId"
                type="text"
                value={form.cardId}
                onChange={onChange}
                maxLength={9}
                inputMode="numeric"
                className={errors.cardId ? styles.invalid : ""}
              />
              {errors.cardId && (
                <div className={styles.fieldErr}>
                  {t.invalidCardId}
                </div>
              )}
            </div>

            <div className={styles.threeFg}>
              <div className={styles.fg}>
                <label htmlFor="f-expiry">{t.expiry}</label>
                <input
                  id="f-expiry"
                  name="expiry"
                  type="text"
                  value={form.expiry}
                  onChange={onChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  inputMode="numeric"
                  className={errors.expiry ? styles.invalid : ""}
                />
                {errors.expiry && (
                  <div className={styles.fieldErr}>{t.invalidExpiry}</div>
                )}
              </div>

              <div className={styles.fg}>
                <label htmlFor="f-cvv">CVV</label>
                <input
                  id="f-cvv"
                  name="cvv"
                  type="text"
                  value={form.cvv}
                  onChange={onChange}
                  placeholder="•••"
                  maxLength={3}
                  inputMode="numeric"
                  className={errors.cvv ? styles.invalid : ""}
                />
                {errors.cvv && (
                  <div className={styles.fieldErr}>{t.invalidCvv}</div>
                )}
              </div>

              <div className={styles.fg}></div>
            </div>

            {showInstallments && (
              <div className={styles.installWrap}>
                <div className={styles.fg}>
                  <label>{t.installmentsCount}</label>
                </div>

                <div className={styles.installRow}>
                  {installments.map((count) => {
                    const monthly = Math.ceil(total / count);

                    return (
                      <div
                        key={count}
                        className={`${styles.installOpt} ${
                          selectedInstallments === count ? styles.sel : ""
                        }`}
                        onClick={() => onSelectInstallments(count)}
                        role="button"
                        tabIndex={0}
                      >
                        {count === 1
                          ? t.onePayment
                          : `${count} × ₪${monthly.toLocaleString()}`}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {payMethod === "bit" && (
          <div>
            <div className={`${styles.alert} ${styles.alertInfo}`}>
              {t.bitInfo}
            </div>

            <div className={styles.fg}>
              <label htmlFor="f-bit-phone">{t.bitPhone}</label>
              <input
                id="f-bit-phone"
                name="bitPhone"
                type="tel"
                value={form.bitPhone}
                onChange={onChange}
                className={errors.bitPhone ? styles.invalid : ""}
              />
              {errors.bitPhone && (
                <div className={styles.fieldErr}>{t.invalidPhone}</div>
              )}
            </div>
          </div>
        )}

        {payMethod === "paypal" && (
          <div>
            <div className={`${styles.alert} ${styles.alertInfo}`}>
              {t.paypalInfo}
            </div>

            {errors.email && (
              <div className={styles.fieldErr} style={{ display: "block", marginTop: "0.5rem" }}>
                {t.paypalEmailRequired}
              </div>
           )}
         </div>
       )}

        {payMethod === "cash" && (
          <div className={`${styles.alert} ${styles.alertWarn}`}>
            {t.cashInfoLine1}
            <br />
            {t.cashInfoLine2Prefix} <strong>{t.cashInfoLine2Bold}</strong> {t.cashInfoLine2Rest}
          </div>
        )}

        {payMethod === "giftcard" && (
          <div className={styles.fg}>
            <label htmlFor="f-giftcard">{t.giftCardCode}</label>
            <input
              id="f-giftcard"
              type="text"
              value={giftCardCode}
              onChange={(e) => setGiftCardCode(e.target.value)}
              placeholder="GC-XXXXXXXX"
              className={errors.giftCardCode ? styles.invalid : ""}
            />
            {errors.giftCardCode && (
              <div className={styles.fieldErr}>
                {t.invalidGiftCard}
              </div>
            )}
          </div>
        )}
      </div>

      <CheckoutPriceBox
        subtotal={subtotal}
        discount={discount}
        pointsDiscount={pointsDiscount}
        shipping={shippingCost}
        total={total}
        payMethod={payMethod}
        installments={selectedInstallments}
      />

      <div className={styles.termsWrap}>
        <label className={styles.termsLabel}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={onToggleTerms}
          />
          {t.termsAgreement}
        </label>

        {errors.terms && (
          <div className={styles.errTerms}>{t.mustAcceptTerms}</div>
        )}
      </div>

      <div className={styles.btnRow}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={onBack}
        >
          {t.backButton}
        </button>

        <button
          type="button"
          className={`${styles.btn} ${styles.btnGold}`}
          onClick={onPay}
        >
          {t.payNow}
        </button>
      </div>

      <div className={styles.trustRow}>
        <div className={styles.trustItem}>{t.trustSsl}</div>
        <div className={styles.trustItem}>{t.trustPci}</div>
        <div className={styles.trustItem}>{t.trustReturns}</div>
        <div className={styles.trustItem}>{t.trustSupport}</div>
      </div>
    </div>
  );
}