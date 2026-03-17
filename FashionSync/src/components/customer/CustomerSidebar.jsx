import sidebarStyles from "../../styles/customer/CustomerSidebar.module.scss";

export default function CustomerSidebar({
  activePanel = "chat",
  isGuest = false,
  currentUser = null,
  sidebarOpen = false,
  toggleTheme,
  goHome,
  goLogin,
  doLogout,
  showPanel,
  navProtected,
  closeSidebar,
}) {
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
        <div className={sidebarStyles.roleBadge}>לקוח</div>

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
            <div className="glabel">👀 מצב צפייה בלבד</div>
            <button className={sidebarStyles.guestLoginBtn} onClick={goLogin}>
              🔑 התחבר לגישה מלאה
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
          <span className={sidebarStyles.navIcon}>💬</span> צ'אטבוט
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
          <span className={sidebarStyles.navIcon}>🏬</span> קטלוג
        </button>

        <button
          className={`${sidebarStyles.navItem} ${
            activePanel === "wishlist" ? sidebarStyles.active : ""
          } ${isGuest ? sidebarStyles.locked : ""}`}
          id="nav-wishlist"
          onClick={() => navProtected("wishlist")}
        >
          <span className={sidebarStyles.navIcon}>❤️</span> רשימת בקשות
        </button>

        <button
          className={`${sidebarStyles.navItem} ${
            activePanel === "orders" ? sidebarStyles.active : ""
          } ${isGuest ? sidebarStyles.locked : ""}`}
          id="nav-orders"
          onClick={() => navProtected("orders")}
        >
          <span className={sidebarStyles.navIcon}>📦</span> ההזמנות שלי
        </button>

        <button
          className={`${sidebarStyles.navItem} ${
            activePanel === "loyalty" ? sidebarStyles.active : ""
          } ${isGuest ? sidebarStyles.locked : ""}`}
          id="nav-loyalty"
          onClick={() => navProtected("loyalty")}
        >
          <span className={sidebarStyles.navIcon}>⭐</span> נקודות וקופונים
        </button>

        <button
          className={`${sidebarStyles.navItem} ${
            activePanel === "giftcard" ? sidebarStyles.active : ""
          } ${isGuest ? sidebarStyles.locked : ""}`}
          id="nav-giftcard"
          onClick={() => navProtected("giftcard")}
        >
          <span className={sidebarStyles.navIcon}>🎁</span> כרטיס מתנה
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
          <span className={sidebarStyles.navIcon}>📋</span> מדיניות
        </button>

        <div className={sidebarStyles.sidebarFooter}>
          <button className={sidebarStyles.navItem} onClick={toggleTheme}>
            <span className={sidebarStyles.navIcon}>🌓</span> מצב כהה/בהיר
          </button>

          <button className={sidebarStyles.navItem} onClick={goHome}>
            <span className={sidebarStyles.navIcon}>🏠</span> דף הבית
          </button>

          {!isGuest && (
            <button
              className={sidebarStyles.navItem}
              id="nav-logout"
              style={{ color: "var(--red)", display: "flex" }}
              onClick={doLogout}
            >
              <span className={sidebarStyles.navIcon}>🚪</span> התנתק
            </button>
          )}
        </div>
      </aside>
    </>
  );
}