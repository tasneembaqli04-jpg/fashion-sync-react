import { useEffect, useState } from "react";
import styles from "../styles/Manager.module.scss";
import LoginOverlay from "../components/manager/LoginOverlay";
import ManagerSidebar from "../components/manager/ManagerSidebar";
import ManagerTopbar from "../components/manager/ManagerTopbar";

import OverviewView from "../components/manager/views/OverviewView";
import InventoryView from "../components/manager/views/InventoryView";
import AlertsView from "../components/manager/views/AlertsView";
import TasksView from "../components/manager/views/TasksView";
import ReceiptsView from "../components/manager/views/ReceiptsView";
import AnalyticsView from "../components/manager/views/AnalyticsView";
import SettingsView from "../components/manager/views/SettingsView";

import DetailsModal from "../components/manager/modals/DetailsModal";
import { PRODUCTS_SEED } from "../data/products";

export default function Manager() {
  const [theme, setTheme] = useState("dark");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [globalSearch, setGlobalSearch] = useState("");

  const [products, setProducts] = useState(PRODUCTS_SEED);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("light", theme === "light");
  }, [theme]);

  const handleLogin = ({ username, password }) => {
    if (username === "manager" && password === "admin123") {
      setIsLoggedIn(true);
      return { success: true };
    }
    return { success: false };
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleGoHome = () => {
    window.location.href = "/home";
  };

  const openDetailsModal = (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProduct(null);
  };

  const handleSaveDetails = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.code === updatedProduct.code ? updatedProduct : item
      )
    );

    setSelectedProduct(updatedProduct);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return <OverviewView />;

      case "inventory":
        return (
          <InventoryView
            products={products}
            onOpenDetails={openDetailsModal}
          />
        );

      case "alerts":
        return <AlertsView products={products} />;

      case "tasks":
        return <TasksView />;

      case "receipts":
        return <ReceiptsView />;

      case "analytics":
        return <AnalyticsView />;

      case "settings":
        return <SettingsView />;

      default:
        return <OverviewView />;
    }
  };

  return (
    <div className={styles.managerPage}>
      {!isLoggedIn && <LoginOverlay onLogin={handleLogin} />}

      <div
        className={`${styles.mobOverlay} ${
          mobileSidebarOpen ? styles.show : ""
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <div
        className={styles.appShell}
        style={{ display: isLoggedIn ? "flex" : "none" }}
      >
        <ManagerSidebar
          activeView={activeView}
          onChangeView={(view) => {
            setActiveView(view);
            setMobileSidebarOpen(false);
          }}
          mobileSidebarOpen={mobileSidebarOpen}
          theme={theme}
          onToggleTheme={() =>
            setTheme((prev) => (prev === "dark" ? "light" : "dark"))
          }
          onGoHome={handleGoHome}
          onLogout={handleLogout}
        />

        <div className={styles.mainWrap}>
          <ManagerTopbar
            activeView={activeView}
            globalSearch={globalSearch}
            onSearchChange={setGlobalSearch}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
            onRefresh={() => window.location.reload()}
            onOpenAddProduct={() => {}}
            onOpenScan={() => {}}
          />

          <div className={styles.content}>{renderActiveView()}</div>
        </div>
      </div>

      <DetailsModal
        open={showDetailsModal}
        onClose={closeDetailsModal}
        product={selectedProduct}
        onSaveDetails={handleSaveDetails}
      />
    </div>
  );
}
