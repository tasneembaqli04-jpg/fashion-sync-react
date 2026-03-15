import styles from "../../styles/Home.module.scss";

export default function HomeHero({ onOpenIntent }) {
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
        <button className={styles.roleCard} onClick={onOpenIntent} type="button">
          <div className={styles.cardIcon}>🛍️</div>
          <div className={styles.cardTitle}>לקוח</div>
          <div className={styles.cardDesc}>
            חיפוש מוצרים, צ'אטבוט, מדידה וירטואלית ועוד
          </div>
          <div className={styles.cardArrow}>↓</div>
        </button>
      </div>
    </main>
  );
}
