import styles from "../../styles/checkout/CheckoutForms.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CheckoutStep1Details({
  form,
  errors,
  onChange,
  onNext,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.checkout.step1;

  return (
    <div className={styles.stepPanel}>
      <div className={styles.card}>
        <div className={styles.secTitle}>{t.personalDetailsTitle}</div>

        <div className={styles.twoFg}>
          <div className={styles.fg}>
            <label htmlFor="f-first">{t.firstName}</label>
            <input
              id="f-first"
              name="firstName"
              type="text"
              value={form.firstName}
              onChange={onChange}
              className={errors.firstName ? styles.invalid : ""}
            />
            {errors.firstName && (
              <div className={styles.fieldErr}>{t.requiredField}</div>
            )}
          </div>

          <div className={styles.fg}>
            <label htmlFor="f-last">{t.lastName}</label>
            <input
              id="f-last"
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={onChange}
              className={errors.lastName ? styles.invalid : ""}
            />
            {errors.lastName && (
              <div className={styles.fieldErr}>{t.requiredField}</div>
            )}
          </div>
        </div>

        <div className={styles.fg}>
          <label htmlFor="f-email">{t.email}</label>
          <input
            id="f-email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            className={errors.email ? styles.invalid : ""}
          />
          {errors.email && (
            <div className={styles.fieldErr}>{t.invalidEmail}</div>
          )}
        </div>

        <div className={styles.fg}>
          <label htmlFor="f-phone">{t.phone}</label>
          <input
            id="f-phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={onChange}
            className={errors.phone ? styles.invalid : ""}
          />
          {errors.phone && (
            <div className={styles.fieldErr}>{t.invalidPhone}</div>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.secTitle}>{t.shippingAddressTitle}</div>

        <div className={styles.fg}>
          <label htmlFor="f-street">{t.street}</label>
          <input
            id="f-street"
            name="street"
            type="text"
            value={form.street}
            onChange={onChange}
            className={errors.street ? styles.invalid : ""}
          />
          {errors.street && (
            <div className={styles.fieldErr}>{t.requiredField}</div>
          )}
        </div>

        <div className={styles.twoFg}>
          <div className={styles.fg}>
            <label htmlFor="f-city">{t.city}</label>
            <input
              id="f-city"
              name="city"
              type="text"
              value={form.city}
              onChange={onChange}
              className={errors.city ? styles.invalid : ""}
            />
            {errors.city && (
              <div className={styles.fieldErr}>{t.requiredField}</div>
            )}
          </div>

          <div className={styles.fg}>
            <label htmlFor="f-zip">{t.zip}</label>
            <input
              id="f-zip"
              name="zip"
              type="text"
              value={form.zip}
              onChange={onChange}
            />
          </div>
        </div>

        <div className={styles.fg}>
          <label htmlFor="f-notes">{t.notes}</label>
          <input
            id="f-notes"
            name="notes"
            type="text"
            value={form.notes}
            onChange={onChange}
          />
        </div>
      </div>

      <button
        type="button"
        className={`${styles.btn} ${styles.btnGold}`}
        onClick={onNext}
      >
        {t.continueButton}
      </button>
    </div>
  );
}