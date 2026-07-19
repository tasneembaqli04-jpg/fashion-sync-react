import sidebarStyles from "../../styles/customer/CustomerSidebar.module.scss";
import LanguageToggle from "../common/LanguageToggle";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CustomerSidebar({
  activePanel = "chat",
  isGuest = false,
  currentUser = null,
  sidebarOpen = false,
  toggleTheme,
  goLogin,
  doLogout,
  showPanel,
  navProtected,
  closeSidebar,
  stockAlertsCount = 0,
  activeOrdersCount = 0,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.sidebar;

  function Badge({ count, color }) {
    if (!count) return null;
    return (
      <span
        style={{
          background: color,
          color: color === "var(--gold)" ? "#111" : "#fff",
          fontSize: "0.68rem",
          fontWeight: 800,
          minWidth: "18px",
          height: "18px",
          borderRadius: "999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 5px",
          flexShrink: 0,
        }}
      >
        {count}
      </span>
    );
  }

  return (
    <>
      <div
        className={`${sidebarStyles.sidebarOverlay} ${
          sidebarOpen ? sidebarStyles.show : ""
        }`}
        id="sidebar-overlay"
        onClick={closeSidebar}
      />

      <aside
        className={`${sidebarStyles.sidebar} ${
          sidebarOpen ? sidebarStyles.open : ""
        }`}
        id="sidebar"
      >
        <div className={sidebarStyles.brand}>FashionSync</div>
        <div className={sidebarStyles.roleBadge}>{t.roleBadge}</div>

        <div style={{ padding: "0.5rem 0.9rem" }}>
          <LanguageToggle style={{ width: "100%", justifyContent: "center" }} />
        </div>

        {!isGuest && currentUser ? (
          <div
            className={sidebarStyles.userInfoBar}
            id="sidebar-user-info"
            style={{ display: "block" }}
          >
            <div className="uname" id="sidebar-uname">
              {currentUser.name}
            </div>
            <div className="uemail" id="sidebar-uemail">
              {currentUser.email}
            </div>
          </div>
        ) : (
          <div
            className={sidebarStyles.guestBar}
            id="sidebar-guest-bar"
            style={{ display: "block" }}
          >
            <div className="glabel">{t.guestModeLabel}</div>
            <button className={sidebarStyles.guestLoginBtn} onClick={goLogin}>
              {t.guestLoginButton}
            </button>
          </div>
        )}

        <button
          className={`${sidebarStyles.navItem} ${
            activePanel === "chat" ? sidebarStyles.active : ""
          }`}
          id="nav-chat"
          onClick={() => {
            showPanel("chat");
            closeSidebar();
          }}
        >
          <span className={sidebarStyles.navIcon}>💬</span>
          <span style={{ flex: 1 }}>{t.navChat}</span>
        </button>

        <button
          className={`${sidebarStyles.navItem} ${
            activePanel === "browse" ? sidebarStyles.active : ""
          }`}
          id="nav-browse"
          onClick={() => {
            showPanel("browse");
            closeSidebar();
          }}
        >
          <span className={sidebarStyles.navIcon}>🏬</span>
          <span style={{ flex: 1 }}>{t.navCatalog}</span>
          <Badge count={stockAlertsCount} color="var(--red)" />
        </button>

        <button
          className={`${sidebarStyles.navItem} ${
            activePanel === "wishlist" ? sidebarStyles.active : ""
          } ${isGuest ? sidebarStyles.locked : ""}`}
          id="nav-wishlist"
          onClick={() => navProtected("wishlist")}
        >
          <span className={sidebarStyles.navIcon}>❤️</span>
          <span style={{ flex: 1 }}>{t.navWishlist}</span>
        </button>

        <button
          className={`${sidebarStyles.navItem} ${
            activePanel === "orders" ? sidebarStyles.active : ""
          } ${isGuest ? sidebarStyles.locked : ""}`}
          id="nav-orders"
          onClick={() => navProtected("orders")}
        >
          <span className={sidebarStyles.navIcon}>📦</span>
          <span style={{ flex: 1 }}>{t.navOrders}</span>
          <Badge count={activeOrdersCount} color="var(--gold)" />
        </button>

        <button
          className={`${sidebarStyles.navItem} ${
            activePanel === "loyalty" ? sidebarStyles.active : ""
          } ${isGuest ? sidebarStyles.locked : ""}`}
          id="nav-loyalty"
          onClick={() => navProtected("loyalty")}
        >
          <span className={sidebarStyles.navIcon}>⭐</span>
          <span style={{ flex: 1 }}>{t.navLoyalty}</span>
        </button>

        <button
          className={`${sidebarStyles.navItem} ${
            activePanel === "giftcard" ? sidebarStyles.active : ""
          } ${isGuest ? sidebarStyles.locked : ""}`}
          id="nav-giftcard"
          onClick={() => navProtected("giftcard")}
        >
          <span className={sidebarStyles.navIcon}>🎁</span>
          <span style={{ flex: 1 }}>{t.navGiftCard}</span>
        </button>

        <button
          className={`${sidebarStyles.navItem} ${
            activePanel === "policy" ? sidebarStyles.active : ""
          }`}
          id="nav-policy"
          onClick={() => {
            showPanel("policy");
            closeSidebar();
          }}
        >
          <span className={sidebarStyles.navIcon}>📋</span>
          <span style={{ flex: 1 }}>{t.navPolicy}</span>
        </button>

        <div className={sidebarStyles.sidebarFooter}>
          <button className={sidebarStyles.navItem} onClick={toggleTheme}>
            <span className={sidebarStyles.navIcon}>🌓</span>
            <span style={{ flex: 1 }}>{t.themeToggle}</span>
          </button>

          {!isGuest && (
            <button
              className={sidebarStyles.navItem}
              id="nav-logout"
              style={{ color: "var(--red)" }}
              onClick={doLogout}
            >
              <span className={sidebarStyles.navIcon}>🚪</span>
              <span style={{ flex: 1 }}>{t.logout}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}