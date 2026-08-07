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
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.sidebar;

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

        <div className={topbarStyles.brand}>FashionSync</div>

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
          <div className={topbarStyles.desktopBrand}>FashionSync</div>
        </div>

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