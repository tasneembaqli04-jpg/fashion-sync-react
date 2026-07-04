import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginOverlay from "../components/manager/LoginOverlay";
import ManagerSidebar from "../components/manager/ManagerSidebar";
import ManagerTopbar from "../components/manager/ManagerTopbar";
import DetailsModal from "../components/manager/modals/DetailsModal";
import ScanModal from "../components/manager/modals/ScanModal";
import PromoModal from "../components/manager/modals/PromoModal";
import OverviewView from "../components/manager/views/OverviewView";
import AddProductModal from "../components/manager/modals/AddProductModal";
import InventoryView from "../components/manager/views/InventoryView";
import AlertsView from "../components/manager/views/AlertsView";
import ReceiptsView from "../components/manager/views/ReceiptsView";
import AnalyticsView from "../components/manager/views/AnalyticsView";
import SettingsView from "../components/manager/views/SettingsView";
import styles from "../styles/Manager.module.scss";
import ManagerOrders from "../components/manager/views/ManagerOrders";
import ManagerDeliveries from "../components/manager/views/ManagerDeliveries";
import { INITIAL_PRODUCTS } from "../data/managerInitialProducts";
import { createAlerts, buildReceipts } from "../functions/manager/managerHelpers";
import { getProducts, addProduct, deleteProduct } from "../functions/productsService";
import { getAllOrders, updateOrderStatus, advanceOrderStatus } from "../functions/orders/ordersService";
import {
  getAllDeliveries,
  addDelivery,
  updateDeliveryStatus,
  deleteDelivery,
} from "../functions/deliveries/deliveriesService";
import { getAllCustomers } from "../functions/customer/customerFirestore";
import {
  loadTheme,
  saveTheme,
  loadFeaturedProductCode,
  saveFeaturedProduct,
  clearFeaturedProduct,
} from "../functions/manager/managerStorage";

export default function Manager({ onPromote }) {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [promoMessage, setPromoMessage] = useState(null);
  const [theme, setTheme] = useState(loadTheme);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const [orders, setOrders] = useState([]);

  useEffect(() => {
  if (!isLoggedIn) return;

  let cancelled = false;

  async function loadOrdersWithCustomers() {
    const [firestoreOrders, customers] = await Promise.all([
      getAllOrders(),
      getAllCustomers(),
    ]);
    console.log("Orders:", firestoreOrders);
    console.log("Customers:", customers);

    if (cancelled) return;

    const customersMap = new Map(
      customers.map((customer) => [customer.email, customer])
    );

    const normalized = firestoreOrders.map((order) => {
      const customer = customersMap.get(order.customerEmail);

      return {
        docId: order.docId,
        id: order.id,

        customerDetails: customer || null,
        customerEmail: order.customerEmail,

        status: order.ready ? "ready" : "pending",
        items: Array.isArray(order.items) ? order.items : [],
        total: Number(order.total) || 0,
        date: order.date || order.createdAt || null,
        payMethod: order.payMethod || "",
        shipping: order.shipping || null,
      };
    });

    setOrders(normalized);
  }

  loadOrdersWithCustomers();

  return () => {
    cancelled = true;
  };
}, [isLoggedIn]);

  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    getAllDeliveries().then((firestoreDeliveries) => {
      if (!cancelled) {
        setDeliveries(firestoreDeliveries);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const [currentPromotedCode, setCurrentPromotedCode] = useState(
    loadFeaturedProductCode(),
  );

  const alerts = useMemo(() => createAlerts(products), [products]);
  const receipts = useMemo(() => {
     if (!Array.isArray(products) || products.length === 0) return [];
     return buildReceipts(products.filter(Boolean));
  }, [products]);
 

  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowCount = products.filter(
      (p) => p.stock === 0 || (p.stock > 0 && p.stock <= p.minStock),
    ).length;
    const demandCount = products.filter((p) => p.notifyCount > 15).length;
    const sales = receipts.reduce((sum, r) => sum + r.total, 0);
    return {
      totalStock,
      lowCount,
      demandCount,
      sales,
      productCount: products.length,
      receiptCount: receipts.length,
    };
  }, [products, receipts]);

  const filteredProducts = useMemo(() => {
    if (!globalSearch.trim()) return products;
    const q = globalSearch.trim();
    return products.filter(
      (p) =>
        p.name.includes(q) ||
        p.code.includes(q) ||
        p.cat.includes(q) ||
        (p.season || "").includes(q),
    );
  }, [products, globalSearch]);

  const promotedProduct = products.find((p) => p.code === currentPromotedCode);
  const currentPromotedImg = promotedProduct?.img || null;

  const isCurrentlyPromoted =
    selectedProduct && currentPromotedCode === selectedProduct.code;

  const handlePromoteAction = (product) => {
    if (onPromote) onPromote(product);
    setCurrentPromotedCode(product.code);
    saveFeaturedProduct(product);
    setPromoMessage(product.name);
    setIsPromoOpen(false);
    setTimeout(() => setSelectedProduct(null), 0);
    setTimeout(() => setPromoMessage(null), 3000);
  };

  const handleCancelPromote = () => {
    clearFeaturedProduct();
    setCurrentPromotedCode(null);
    if (onPromote) onPromote(null);
    setPromoMessage("הקידום בוטל בהצלחה");
    setIsPromoOpen(false);
    setTimeout(() => setSelectedProduct(null), 0);
    setTimeout(() => setPromoMessage(null), 3000);
  };

  const handleScanCode = (code) => {
    const found = products.find(
      (p) => p.code.toUpperCase() === code.trim().toUpperCase(),
    );
    setGlobalSearch(found ? found.code : code);
    setActiveView("inventory");
  };
  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      saveTheme(next);
      return next;
    });
  };

  useEffect(() => {
    document.body.classList.toggle("light", theme === "light");
  }, [theme]);
  useEffect(() => {
  if (!isLoggedIn) return;

  async function loadManagerProducts() {
    const productsFromFirestore = await getProducts();
    setProducts(productsFromFirestore);
  }

  loadManagerProducts();
}, [isLoggedIn]);
 

  const handleDelete = async (code) => {
     await deleteProduct(code);
     setProducts((prev) => prev.filter((p) => p.code !== code));
  };

  function handleToggleOrderReady(orderId) {
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id !== orderId) return order;

        const newStatus = order.status === "ready" ? "pending" : "ready";

        if (order.docId) {
          updateOrderStatus(order.docId, newStatus === "ready");
        }

        return { ...order, status: newStatus };
      });

      const changedOrder = updatedOrders.find((order) => order.id === orderId);

      setDeliveries((prevDeliveries) => {
        let updatedDeliveries = [...prevDeliveries];

        if (changedOrder && changedOrder.status === "ready") {
          const alreadyExists = updatedDeliveries.some(
            (delivery) => delivery.orderId === changedOrder.id,
          );

          if (!alreadyExists) {
            const delivery = {
              id: `DEL-${Date.now()}`,
              orderId: changedOrder.id,
              orderDocId: changedOrder.docId || null,
              customer:
                changedOrder.customerDetails?.name ||
                changedOrder.customerDetails?.email ||
                changedOrder.customerEmail ||
                "לקוח",
              customerEmail: changedOrder.customerEmail || null,
              items: changedOrder.items || [],
              status: 1,
              createdAt: Date.now(),
            };

            addDelivery(delivery);
            updatedDeliveries = [delivery, ...updatedDeliveries];
          }
        } else {
          const removedDelivery = updatedDeliveries.find(
            (delivery) => delivery.orderId === orderId,
          );

          if (removedDelivery) {
            deleteDelivery(removedDelivery.id);
          }

          updatedDeliveries = updatedDeliveries.filter(
            (delivery) => delivery.orderId !== orderId,
          );
        }

        return updatedDeliveries;
      });
      return updatedOrders;
    });
  }
  function handleMarkAllPicked() {
    setDeliveries((prevDeliveries) => {
      const updatedDeliveries = prevDeliveries.map((delivery) => {
        if (delivery.status < 3) {
          const nextIndex = delivery.status + 1;
          updateDeliveryStatus(delivery.id, nextIndex);
          if (delivery.orderDocId) {
            advanceOrderStatus(delivery.orderDocId, nextIndex);
          }
          return { ...delivery, status: nextIndex };
        }
        return delivery;
      });

      return updatedDeliveries;
    });
  }
  function handleUpdateDeliveryStatus(deliveryId, nextIndex) {
    updateDeliveryStatus(deliveryId, nextIndex);

    setDeliveries((prevDeliveries) => {
      const updatedDeliveries = prevDeliveries.map((delivery) => {
        if (delivery.id !== deliveryId) return delivery;

        if (delivery.orderDocId) {
          advanceOrderStatus(delivery.orderDocId, nextIndex);
        }

        return { ...delivery, status: nextIndex };
      });

      return updatedDeliveries;
    });
  }

  const shellClassName = `${styles.appShell} ${theme === "light" ? styles.light : styles.dark}`;

  if (!isLoggedIn)
    return <LoginOverlay onLoginSuccess={() => setIsLoggedIn(true)} />;

  return (
    <div className={shellClassName}>
      <ManagerSidebar
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
          setMobileSidebarOpen(false);
        }}
        onLogout={() => {
          if (!window.confirm("להתנתק?")) return;
          setIsLoggedIn(false);
          setActiveView("overview");
          navigate("/");
        }}
        onGoHome={() => {
          if (!window.confirm("לחזור לדף הבית?")) return;
          navigate("/");
        }}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        alertCount={alerts.length}
        mobileOpen={mobileSidebarOpen}
      />

      {mobileSidebarOpen && (
        <div
          className={styles.mobOverlay}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className={styles.mainWrap}>
        <ManagerTopbar
          currentPromotedImg={currentPromotedImg}
          globalSearch={globalSearch}
          onGlobalSearchChange={(val) => {
            setGlobalSearch(val);
            if (val.trim()) setActiveView("inventory");
          }}
          onRefresh={() => window.location.reload()}
          onAddProductClick={() => setIsAddProductOpen(true)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenScan={() => setIsScanOpen(true)}
          onCancelPromote={handleCancelPromote}
        />

        <div className={styles.content}>
          {activeView === "overview" && (
            <OverviewView
              stats={stats}
              alerts={alerts}
              products={products}
              receipts={receipts}
              onOpenAlerts={() => setActiveView("alerts")}
              promotedCode={currentPromotedCode}
              onPromote={(p) => {
                setSelectedProduct(p);
                setIsPromoOpen(true);
              }}
            />
          )}

          {activeView === "inventory" && (
            <InventoryView
              products={filteredProducts}
              promotedCode={currentPromotedCode}
              onOpenDetails={(p) => {
                setSelectedProduct(p);
                setIsDetailsOpen(true);
              }}
              onDeleteProduct={handleDelete}
              onOpenPromo={(p) => {
                setSelectedProduct(p);
                setIsPromoOpen(true);
              }}
              onCancelPromote={handleCancelPromote}
            />
          )}

          {activeView === "alerts" && (
            <AlertsView alerts={alerts} products={products} />
          )}



          {activeView === "orders" && (
            <ManagerOrders
              orders={orders}
              onToggleOrderReady={handleToggleOrderReady}
            />
          )}
          {activeView === "deliveries" && (
            <ManagerDeliveries
              deliveries={deliveries}
              onUpdateStatus={handleUpdateDeliveryStatus}
              onMarkAllPicked={handleMarkAllPicked}
            />
          )}
         

          {activeView === "receipts" && <ReceiptsView receipts={receipts} />}
          {activeView === "analytics" && <AnalyticsView />}
          {activeView === "settings" && <SettingsView />}
        </div>
      </div>

      <AddProductModal
        isOpen={isAddProductOpen}
        theme={theme}
        onClose={() => setIsAddProductOpen(false)}
        onSubmit={async (p) => {
           await addProduct(p);
           setProducts((prev) => [...prev, p]);
           setIsAddProductOpen(false);
        }}
      />

      <DetailsModal
        isOpen={isDetailsOpen}
        product={selectedProduct}
        theme={theme}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedProduct(null);
        }}
        onSave={(updated) => {
          setProducts((prev) =>
            prev.map((p) => (p.code === updated.code ? updated : p)),
          );
          setIsDetailsOpen(false);
          setSelectedProduct(null);
        }}
      />

      <ScanModal
        open={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onCodeScanned={handleScanCode}
      />

      <PromoModal
        open={isPromoOpen}
        product={selectedProduct}
        isCurrentlyPromoted={isCurrentlyPromoted}
        onClose={() => {
          setIsPromoOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handlePromoteAction}
        onCancelPromote={handleCancelPromote}
      />

      {promoMessage && (
        <div className={styles.centerToastContainer}>
          <div className={styles.promoCard}>
            <div className={styles.checkBadge}>✓</div>
            <div className={styles.textDetails}>
              <strong>הפעולה הצליחה!</strong>
              <span> "{promoMessage}" עודכן בדף הבית.</span>
            </div>
            <button
              onClick={() => setPromoMessage(null)}
              className={styles.closeX}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}