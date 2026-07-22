import styles from "../../styles/manager/ManagerSidebar.module.scss";
import LanguageToggle from "../common/LanguageToggle";
import { useLanguage } from "../../translations/LanguageProvider";

export default function ManagerSidebar({
  activeView,
  onChangeView,
  onLogout,
  onToggleTheme,
  theme,
  alertCount,
  pendingOrdersCount = 0,
  pendingDeliveriesCount = 0,
  pendingStockRequestsCount = 0,
  mobileOpen,
}) {
  const { t: dict } = useLanguage();
  const t = dict.manager.nav;

  function NavBadge({ count }) {
    if (!count) return null;
    return <span className={styles.navBadge}>{count}</span>;
  }

  return (
    <aside
      className={`${styles.sidebar} ${mobileOpen ? "" : styles.mobHidden}`}
    >
      <div className={styles.sbBrand}>
        <div className={styles.sbLogo}>FashionSync</div>
        <div className={styles.sbRole}>{t.roleMain}</div>
      </div>

      <div style={{ padding: "0 0.6rem 0.6rem" }}>
        <LanguageToggle style={{ width: "100%", justifyContent: "center" }} />
      </div>

      <nav className={styles.sbNav}>
        <div className={styles.sbSec}>{t.sectionMain}</div>

        <button
          className={`${styles.navBtn} ${
            activeView === "overview" ? styles.active : ""
          }`}
          onClick={() => onChangeView("overview")}
        >
          <span className={styles.icon}>📊</span>
          <span style={{ flex: 1 }}>{t.overview}</span>
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "inventory" ? styles.active : ""
          }`}
          onClick={() => onChangeView("inventory")}
        >
          <span className={styles.icon}>👗</span>
          <span style={{ flex: 1 }}>{t.inventory}</span>
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "alerts" ? styles.active : ""
          }`}
          onClick={() => onChangeView("alerts")}
        >
          <span className={styles.icon}>🔔</span>
          <span style={{ flex: 1 }}>{t.alerts}</span>
          {alertCount > 0 && <div className={styles.navDot} />}
        </button>

        <div className={styles.sbSec}>{t.sectionSales}</div>
        <button
          className={`${styles.navBtn} ${
            activeView === "orders" ? styles.active : ""
          }`}
          onClick={() => onChangeView("orders")}
        >
          <span className={styles.icon}>📦</span>
          <span style={{ flex: 1 }}>{t.customerOrders}</span>
          <NavBadge count={pendingOrdersCount} />
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "deliveries" ? styles.active : ""
          }`}
          onClick={() => onChangeView("deliveries")}
        >
          <span className={styles.icon}>🚚</span>
          <span style={{ flex: 1 }}>{t.deliveryTracking}</span>
          <NavBadge count={pendingDeliveriesCount} />
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "receipts" ? styles.active : ""
          }`}
          onClick={() => onChangeView("receipts")}
        >
          <span className={styles.icon}>🧾</span>
          <span style={{ flex: 1 }}>{t.salesReceipts}</span>
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "analytics" ? styles.active : ""
          }`}
          onClick={() => onChangeView("analytics")}
        >
          <span className={styles.icon}>📉</span>
          <span style={{ flex: 1 }}>{t.analytics}</span>
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "feedback" ? styles.active : ""
          }`}
          onClick={() => onChangeView("feedback")}
        >
          <span className={styles.icon}>💬</span>
          <span style={{ flex: 1 }}>{t.customerFeedback}</span>
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "stockNotifications" ? styles.active : ""
          }`}
          onClick={() => onChangeView("stockNotifications")}
        >
          <span className={styles.icon}>🔔</span>
          <span style={{ flex: 1 }}>{t.stockRequests}</span>
          <NavBadge count={pendingStockRequestsCount} />
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "returns" ? styles.active : ""
          }`}
          onClick={() => onChangeView("returns")}
        >
          <span className={styles.icon}>↩️</span>
          <span style={{ flex: 1 }}>{t.returnRequests}</span>
        </button>

        <button
          className={`${styles.navBtn} ${
            activeView === "coupons" ? styles.active : ""
          }`}
          onClick={() => onChangeView("coupons")}
        >
          <span className={styles.icon}>🎟️</span>
          <span style={{ flex: 1 }}>{t.coupons}</span>
        </button>

        <div className={styles.sbSec}>{t.sectionSettings}</div>

        <button
          className={`${styles.navBtn} ${
            activeView === "settings" ? styles.active : ""
          }`}
          onClick={() => onChangeView("settings")}
        >
          <span className={styles.icon}>⚙️</span>
          <span style={{ flex: 1 }}>{t.settings}</span>
        </button>
      </nav>

      <div className={styles.sbFooter}>
        <button className={styles.navBtn} onClick={onToggleTheme}>
          <span className={styles.icon}>{theme === "light" ? "☀️" : "🌙"}</span>
          <span style={{ flex: 1 }}>{t.themeToggle}</span>
        </button>

        <button
          className={styles.navBtn}
          onClick={onLogout}
          style={{ color: "var(--red)" }}
        >
          <span className={styles.icon}>🚪</span>
          <span style={{ flex: 1 }}>{t.logout}</span>
        </button>
      </div>
    </aside>
  );
}