import topbarStyles from "../../styles/customer/CustomerTopbar.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CustomerTopbar({
  cartCountMobile = 0,
  toggleSidebar,
  openCartOrAuth,
  showBackButton = false,
  onGoBack,
  showChatButton = false,
  onOpenChat,
  searchValue = "",
  onSearchChange,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.sidebar;
  const browseT = dict.customer.browse;

  return (
    <>
      <div className={topbarStyles.topbar}>
        <div className={topbarStyles.leftIcons}>
          <button
            className={topbarStyles.iconBtn}
            onClick={toggleSidebar}
            aria-label={t.menuAriaLabel}
          >
            ☰
          </button>

          {showBackButton && (
            <button
              className={topbarStyles.iconBtn}
              onClick={onGoBack}
              aria-label={t.backAriaLabel}
            >
              →
            </button>
          )}
        </div>

        <div className={topbarStyles.topbarSearchWrap}>
          <span className={topbarStyles.searchIcon}>🔍</span>
          <input
            type="text"
            className={topbarStyles.topbarSearchInput}
            placeholder={browseT.searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        <button
          className={topbarStyles.refreshBtn}
          onClick={() => window.location.reload()}
          aria-label={browseT.refreshTitle}
        >
          🔄
        </button>

        <button className={topbarStyles.cartBtn} onClick={openCartOrAuth}>
          🛒 {cartCountMobile}
        </button>
      </div>

      <div className={topbarStyles.desktopTopbar}>
        <div className={topbarStyles.desktopLeft}>
          {showBackButton && (
            <button
              className={topbarStyles.desktopBackBtn}
              onClick={onGoBack}
              aria-label={t.backAriaLabel}
            >
              →
            </button>
          )}
        </div>

        <div className={topbarStyles.desktopSearchWrap}>
          <span className={topbarStyles.searchIcon}>🔍</span>
          <input
            type="text"
            className={topbarStyles.desktopSearchInput}
            placeholder={browseT.searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        <button
          className={topbarStyles.desktopRefreshBtn}
          onClick={() => window.location.reload()}
          aria-label={browseT.refreshTitle}
        >
          🔄
        </button>

        <button
          className={topbarStyles.desktopCartBtn}
          onClick={openCartOrAuth}
          aria-label={t.cartAriaLabel}
        >
          🛒 {cartCountMobile}
        </button>
      </div>

      {showChatButton && (
        <button
          className={topbarStyles.floatingChatBtn}
          onClick={onOpenChat}
          aria-label={t.chatAriaLabel}
        >
          💬
        </button>
      )}
    </>
  );
}