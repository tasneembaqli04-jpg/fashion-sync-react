import styles from "../../styles/checkout/CheckoutPayment.module.scss";
import CheckoutPriceBox from "./CheckoutPriceBox";

export default function CheckoutStep3Payment({
  payMethod = "card",
  setPayMethod,
  form,
  errors,
  onChange,
  installments = [],
  selectedInstallments = 1,
  onSelectInstallments,
  subtotal = 0,
  discount = 0,
  shippingCost = 0,
  total = 0,
  termsAccepted = false,
  onToggleTerms,
  onBack,
  onPay,
}) {
  const showInstallments = payMethod === "card" && total >= 100;

  return (
    <div className={styles.stepPanel}>
      <div className={styles.card}>
        <div className={styles.secTitle}>💳 שיטת תשלום</div>

        <div className={styles.payMethods}>
          <div
            className={`${styles.payOpt} ${payMethod === "card" ? styles.selected : ""}`}
            onClick={() => setPayMethod("card")}
            role="button"
            tabIndex={0}
          >
            <span className={styles.payIcon}>💳</span>
            כרטיס אשראי
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

          <div
            className={`${styles.payOpt} ${payMethod === "cash" ? styles.selected : ""}`}
            onClick={() => setPayMethod("cash")}
            role="button"
            tabIndex={0}
          >
            <span className={styles.payIcon}>💵</span>
            מזומן באיסוף
          </div>
        </div>

        {payMethod === "card" && (
          <div>
            <div className={styles.fg}>
              <label htmlFor="f-cardnum">מספר כרטיס</label>
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
                <div className={styles.fieldErr}>מספר כרטיס לא תקין</div>
              )}
            </div>

            <div className={styles.fg}>
              <label htmlFor="f-cardholder">שם בעל הכרטיס</label>
              <input
                id="f-cardholder"
                name="cardHolder"
                type="text"
                value={form.cardHolder}
                onChange={onChange}
                className={errors.cardHolder ? styles.invalid : ""}
              />
              {errors.cardHolder && (
                <div className={styles.fieldErr}>שדה חובה</div>
              )}
            </div>

            <div className={styles.fg}>
              <label htmlFor="f-cardid">תעודת זהות של בעל הכרטיס</label>
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
                  מספר ת.ז. לא תקין (9 ספרות)
                </div>
              )}
            </div>

            <div className={styles.threeFg}>
              <div className={styles.fg}>
                <label htmlFor="f-expiry">תוקף</label>
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
                  <div className={styles.fieldErr}>תוקף לא תקין</div>
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
                  <div className={styles.fieldErr}>CVV לא תקין</div>
                )}
              </div>

              <div className={styles.fg}></div>
            </div>

            {showInstallments && (
              <div className={styles.installWrap}>
                <div className={styles.fg}>
                  <label>מספר תשלומים</label>
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
                          ? "תשלום אחד"
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
              📱 לאחר לחיצה על "שלם" תועבר לאפליקציית Bit לאישור.
            </div>

            <div className={styles.fg}>
              <label htmlFor="f-bit-phone">מספר טלפון (חשבון Bit)</label>
              <input
                id="f-bit-phone"
                name="bitPhone"
                type="tel"
                value={form.bitPhone}
                onChange={onChange}
              />
            </div>
          </div>
        )}

        {payMethod === "paypal" && (
          <div className={`${styles.alert} ${styles.alertInfo}`}>
            🅿️ לאחר לחיצה על "שלם" תועבר ל-PayPal לביצוע התשלום.
          </div>
        )}

        {payMethod === "cash" && (
          <div className={`${styles.alert} ${styles.alertWarn}`}>
            💵 תשלום במזומן יבוצע בעת איסוף הסחורה מהחנות.
            <br />
            ההזמנה תישמר <strong>48 שעות</strong> בלבד.
          </div>
        )}
      </div>

      <CheckoutPriceBox
        subtotal={subtotal}
        discount={discount}
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
          קראתי ואני מסכים/ה לתנאי השימוש ולמדיניות הפרטיות.
        </label>

        {errors.terms && (
          <div className={styles.errTerms}>יש לאשר את התנאים להמשך</div>
        )}
      </div>

      <div className={styles.btnRow}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={onBack}
        >
          ← חזרה
        </button>

        <button
          type="button"
          className={`${styles.btn} ${styles.btnGold}`}
          onClick={onPay}
        >
          🔒 שלם עכשיו
        </button>
      </div>

      <div className={styles.trustRow}>
        <div className={styles.trustItem}>🔒 SSL מוצפן</div>
        <div className={styles.trustItem}>🛡️ PCI DSS</div>
        <div className={styles.trustItem}>↩️ החזרות חינם 30 יום</div>
        <div className={styles.trustItem}>📞 תמיכה 24/7</div>
      </div>
    </div>
  );
}