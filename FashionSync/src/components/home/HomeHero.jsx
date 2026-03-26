import styles from "../../styles/Home.module.scss";

export default function HomeHero({ onOpenLogin, onBrowse }) {
  return (
    <main className={styles.hero}>
      <div className={styles.heroEyebrow}>ברוך הבא ל</div>

      <h1 className={styles.heroTitle}>
        Fashion<span>Sync</span>
      </h1>

      <p className={styles.heroSub}>
        מערכת חכמה לחנות הבגדים שלך – מלאי, מכירות, לקוחות ועוד
      </p>

      <div className={styles.roleCards}>
        <div className={styles.intentCard}>

          <p className={styles.intentTitle}>מה תרצה לעשות היום?</p>

          <div className={styles.fsChoices}>
            <button
              className={`${styles.fsChoiceBtn} ${styles.goldBorder}`}
              onClick={onOpenLogin}
              type="button"
            >
              <span className={styles.fci}>🔑</span>
              <div>
                <div className={styles.fcLabel}>כניסה עם מייל וסיסמה</div>
                <div className={styles.fcSub}>גישה מלאה לסל, מועדפים, הזמנות ועוד</div>
              </div>
            </button>

            <button
              className={styles.fsChoiceBtn}
              onClick={onBrowse}
              type="button"
            >
              <span className={styles.fci}>👀</span>
              <div>
                <div className={styles.fcLabel}>רק להסתכל</div>
                <div className={styles.fcSub}>כניסה מהירה לקטלוג ללא התחברות</div>
              </div>
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}