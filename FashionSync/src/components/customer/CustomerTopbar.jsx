import topbarStyles from "../../styles/customer/CustomerTopbar.module.scss";

export default function CustomerTopbar({
  cartCountMobile = 0,
  toggleSidebar,
  openCartOrAuth,
}) {
  return (
    <div className={topbarStyles.mobileTopbar} id="mobile-topbar">
      <button
        className={topbarStyles.hamburger}
        onClick={toggleSidebar}
        aria-label="תפריט"
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