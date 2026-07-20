import styles from "../../styles/Home.module.scss";
import LanguageToggle from "../common/LanguageToggle";
import { useLanguage } from "../../translations/LanguageProvider";

export default function HomeNavbar({ isLight, onToggleTheme }) {
  const { t: dict } = useLanguage();
  const t = dict.home.navbar;

  return (
    <nav className={styles.nav}>
      <div className={styles.navLeft}>
        <div>
          <div className={styles.navBrand}>FashionSync</div>
          <div className={styles.navTagline}>{t.tagline}</div>
        </div>
      </div>

      <div className={styles.navRight}>
        <LanguageToggle />

        <button
          className={styles.themeToggle}
          type="button"
          aria-label={t.themeAriaLabel}
          onClick={onToggleTheme}
        >
          <span>{isLight ? "☀️" : "🌙"}</span>
          <span>{isLight ? t.lightMode : t.darkMode}</span>
        </button>

        <div className={styles.verText}>v2.0 · 2026</div>
      </div>
    </nav>
  );
}