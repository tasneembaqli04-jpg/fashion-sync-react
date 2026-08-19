import styles from "../../styles/manager/ManagerTopbar.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";
export default function ManagerTopbar({
  globalSearch,
  onGlobalSearchChange,
  onRefresh,
  onAddProductClick,
  onOpenMobileSidebar,
  onOpenScan,
  onCancelPromote,
  currentPromotedImg,
  showBackButton = false,
  onGoBack,
}) {
  const { t: dict } = useLanguage();
  const t = dict.manager.topbar;

  return (
    <div className={styles.topbar}>
      {showBackButton && (
        <button
          className={styles.backBtn}
          onClick={onGoBack}
          title={t.backTitle}
          aria-label={t.backTitle}
        >→</button>
      )}

      <button className={styles.mobMenuBtn} onClick={onOpenMobileSidebar} aria-label={t.menuTitle}>☰</button>

      <div className={styles.topbarSearch}>
        <span style={{ color: "var(--muted)" }}>🔍</span>
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={globalSearch}
          onChange={(e) => onGlobalSearchChange(e.target.value)}
        />
        <button
          onClick={onOpenScan}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1rem", padding: "0 0.2rem", lineHeight: 1, flexShrink: 0 }}
          title={t.scanTitle}
          aria-label={t.scanTitle}
        >📷</button>
      </div>

      <button
        className={`${styles.btn} ${styles.btnGhost}`}
        onClick={onRefresh}
        title={t.refreshTitle}
        aria-label={t.refreshTitle}
        style={{ flexShrink: 0, position: "relative", zIndex: 500, cursor: "pointer" }}
      >🔄</button>

      <button
        className={`${styles.btn} ${styles.btnGold}`}
        onClick={onAddProductClick}
        style={{ flexShrink: 0 }}
      >{t.newProductButton}</button>

      <div className={styles.tbRight}>
        {currentPromotedImg && (
          <button
            className={styles.promoBtn}
            onClick={onCancelPromote}
            title={t.cancelPromoTitle}
            aria-label={t.promoActiveButton}
          >
            <img
              src={currentPromotedImg}
              alt=""
              className={styles.promoThumb}
            />
            <span className={styles.promoLabel}>{t.promoActiveButton}</span>
            <span className={styles.promoCancelMark} aria-hidden="true">
              ✕
            </span>
          </button>
        )}
      </div>
    </div>
  );
}