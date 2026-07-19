import styles from "../../styles/Home.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function HomeHero({ onOpenLogin, onBrowse }) {
  const { t: dict } = useLanguage();
  const t = dict.home.hero;

  return (
    <main className={styles.hero}>
      <div className={styles.heroEyebrow}>{t.welcomeTo}</div>

      <h1 className={styles.heroTitle}>
        Fashion<span>Sync</span>
      </h1>

      <p className={styles.heroSub}>
        {t.subtitle}
      </p>

      <div className={styles.roleCards}>
        <div className={styles.intentCard}>

          <p className={styles.intentTitle}>
            {t.customerAreaQuote}
            </p>

          <div className={styles.fsChoices}>
            <button
              className={`${styles.fsChoiceBtn} ${styles.goldBorder}`}
              onClick={onOpenLogin}
              type="button"
            >
              <span className={styles.fci}>🔑</span>
              <div>
                <div className={styles.fcLabel}>{t.loginButtonLabel}</div>
                <div className={styles.fcSub}>
                  {t.loginButtonSub}
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
               {t.browseButtonLabel}
                </div>
                <div className={styles.fcSub}>
                  {t.browseButtonSub}
                </div>
              </div>
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}