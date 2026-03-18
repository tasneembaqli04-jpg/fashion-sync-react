import styles from "../../styles/checkout/CheckoutForms.module.scss";
export default function CheckoutStep1Details({
  form,
  errors,
  onChange,
  onNext,
}) {
  return (
    <div className={styles.stepPanel}>
      <div className={styles.card}>
        <div className={styles.secTitle}>👤 פרטים אישיים</div>

        <div className={styles.twoFg}>
          <div className={styles.fg}>
            <label htmlFor="f-first">שם פרטי</label>
            <input
              id="f-first"
              name="firstName"
              type="text"
              value={form.firstName}
              onChange={onChange}
              className={errors.firstName ? styles.invalid : ""}
            />
            {errors.firstName && (
              <div className={styles.fieldErr}>שדה חובה</div>
            )}
          </div>

          <div className={styles.fg}>
            <label htmlFor="f-last">שם משפחה</label>
            <input
              id="f-last"
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={onChange}
              className={errors.lastName ? styles.invalid : ""}
            />
            {errors.lastName && (
              <div className={styles.fieldErr}>שדה חובה</div>
            )}
          </div>
        </div>

        <div className={styles.fg}>
          <label htmlFor="f-email">כתובת אימייל</label>
          <input
            id="f-email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            className={errors.email ? styles.invalid : ""}
          />
          {errors.email && (
            <div className={styles.fieldErr}>אימייל לא תקין</div>
          )}
        </div>

        <div className={styles.fg}>
          <label htmlFor="f-phone">טלפון</label>
          <input
            id="f-phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={onChange}
            className={errors.phone ? styles.invalid : ""}
          />
          {errors.phone && (
            <div className={styles.fieldErr}>מספר לא תקין</div>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.secTitle}>📦 כתובת למשלוח</div>

        <div className={styles.fg}>
          <label htmlFor="f-street">רחוב ומספר</label>
          <input
            id="f-street"
            name="street"
            type="text"
            value={form.street}
            onChange={onChange}
            className={errors.street ? styles.invalid : ""}
          />
          {errors.street && (
            <div className={styles.fieldErr}>שדה חובה</div>
          )}
        </div>

        <div className={styles.twoFg}>
          <div className={styles.fg}>
            <label htmlFor="f-city">עיר</label>
            <input
              id="f-city"
              name="city"
              type="text"
              value={form.city}
              onChange={onChange}
              className={errors.city ? styles.invalid : ""}
            />
            {errors.city && (
              <div className={styles.fieldErr}>שדה חובה</div>
            )}
          </div>

          <div className={styles.fg}>
            <label htmlFor="f-zip">מיקוד</label>
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
          <label htmlFor="f-notes">הערות למשלוח (אופציונלי)</label>
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
        המשך לבחירת משלוח ←
      </button>
    </div>
  );
}