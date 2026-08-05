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
    <>
      <button
        className={topbarStyles.floatingMenuBtn}
        onClick={toggleSidebar}
        aria-label={t.menuAriaLabel}
      >
        ☰
      </button>

      <button
        className={topbarStyles.floatingCartBtn}
        onClick={openCartOrAuth}
      >
        🛒 {cartCountMobile}
      </button>
    </>
  );
}