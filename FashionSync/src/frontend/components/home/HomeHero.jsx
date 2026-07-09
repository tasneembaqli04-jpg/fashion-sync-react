import styles from "../../styles/Home.module.scss";
export default function HomeHero({ onOpenLogin, onBrowse }) {
  return (
    <main className={styles.hero}>
      <div className={styles.heroEyebrow}>ברוך הבא ל</div>

      <h1 className={styles.heroTitle}>
        Fashion<span>Sync</span>
      </h1>

      <p className={styles.heroSub}>
        ניהול חכם וחוויית קנייה מושלמת – הכל במקום אחד  
      </p>

      <div className={styles.roleCards}>
        <div className={styles.intentCard}>

          <p className={styles.intentTitle}>
            "אזור הלקוחות ✨ הסטייל שלכם מתחיל כאן – התחברו והמשיכו לשופינג"
            </p>

          <div className={styles.fsChoices}>
            <button
              className={`${styles.fsChoiceBtn} ${styles.goldBorder}`}
              onClick={onOpenLogin}
              type="button"
            >
              <span className={styles.fci}>🔑</span>
              <div>
                <div className={styles.fcLabel}>כניסה עם מייל וסיסמה</div>
                <div className={styles.fcSub}>
                  גישה מלאה להזמנות, מועדפים וסל הקניות שלכם
                </div>
              </div>
            </button>

            <button
              className={styles.fsChoiceBtn}
              onClick={onBrowse}
              type="button"
            >
              <span className={styles.fci}>👀</span>
              <div>
                <div className={styles.fcLabel}>
               רק רוצים לראות?
                </div>
                <div className={styles.fcSub}>
                  צפו בקולקציה ללא התחברות
                </div>
              </div>
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}