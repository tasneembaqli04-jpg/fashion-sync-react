import styles from "../../styles/Home.module.scss";

export default function HomeNavbar({ isLight, onToggleTheme }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.navLeft}>
        <div>
          <div className={styles.navBrand}>FashionSync</div>
          <div className={styles.navTagline}>מערכת ניהול חנות בגדים</div>
        </div>
      </div>

      <div className={styles.navRight}>
        <button
          className={styles.themeToggle}
          type="button"
          aria-label="מצב כהה/בהיר"
          onClick={onToggleTheme}
        >
          <span>{isLight ? "☀️" : "🌙"}</span>
          <span>{isLight ? "מצב בהיר" : "מצב כהה"}</span>
        </button>

        <div className={styles.verText}>v2.0 · 2026</div>
      </div>
    </nav>
  );
}
