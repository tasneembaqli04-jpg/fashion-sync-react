import topbarStyles from "../../styles/customer/CustomerTopbar.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CustomerTopbar({
  cartCountMobile = 0,
  toggleSidebar,
  openCartOrAuth,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.sidebar;

  return (
    <div className={topbarStyles.mobileTopbar} id="mobile-topbar">
      <button
        className={topbarStyles.hamburger}
        onClick={toggleSidebar}
        aria-label={t.menuAriaLabel}
      >
        ☰
      </button>

      <div className={topbarStyles.mobileBrand}>FashionSync</div>

      <div className={topbarStyles.mobileTopbarRight}>
        <button className={topbarStyles.mobileCartBtn} onClick={openCartOrAuth}>
          🛒 {cartCountMobile}
        </button>
      </div>
    </div>
  );
}