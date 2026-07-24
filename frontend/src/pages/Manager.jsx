import { useEffect, useMemo, useRef, useState } from "react";
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
import FeedbackView from "../components/manager/views/FeedbackView";
import StockNotificationsView from "../components/manager/views/StockNotificationsView";
import ManagerReturns from "../components/manager/views/ManagerReturns";
import ManagerContactMessages from "../components/manager/views/ManagerContactMessages";
import CouponsView from "../components/manager/views/CouponsView";
import SettingsView from "../components/manager/views/SettingsView";
import styles from "../styles/Manager.module.scss";
import ManagerOrders from "../components/manager/views/ManagerOrders";
import ManagerDeliveries from "../components/manager/views/ManagerDeliveries";
import { createAlerts } from "../functions/manager/managerHelpers";
import { getProducts, addProduct, deleteProduct, updateProduct } from "../services/products/productsService";
import { resolveStockNotifications, getAllStockNotifications } from "../services/notifications/notificationsService";
import { getAllReturnRequests } from "../services/returns/returnsService";
import { getAllContactMessages } from "../services/contact/contactMessagesService";
import { subscribeToOrders, updateOrderStatus, advanceOrderStatus, confirmOrder } from "../services/orders/ordersService";import {
  getAllDeliveries,
  addDelivery,
  updateDeliveryStatus,
  deleteDelivery,
} from "../services/deliveries/deliveriesService";
import { getAllCustomers } from "../services/customer/customerFirestore";
import {
  getFeaturedProduct,
  setFeaturedProduct,
  clearFeaturedProduct,
} from "../services/settings/featuredProductService";
import {
  loadTheme,
  saveTheme,
} from "../functions/manager/managerStorage";
import { sendShippingUpdateEmail, sendStockAlertEmail } from "../services/email/emailService";
import { useDialog } from "../components/common/DialogProvider";
import { useLanguage } from "../translations/LanguageProvider";

export default function Manager({ onPromote }) {
  const navigate = useNavigate();
  const { confirmDialog, alertDialog } = useDialog();
  const { lang, t: dict } = useLanguage();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const contentRef = useRef(null);
  const [activeView, setActiveView] = useState("overview");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [promoMessage, setPromoMessage] = useState(null);
  const [theme, setTheme] = useState(loadTheme);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return;

    let unsubscribe = null;

    async function init() {
      const customers = await getAllCustomers();

      const customersMap = new Map(
        customers.map((customer) => [customer.email, customer])
      );

      unsubscribe = subscribeToOrders((firestoreOrders) => {
        const normalized = firestoreOrders.map((order) => {
          const customer = customersMap.get(order.customerEmail);

          return {
            docId: order.docId,
            id: order.id,

            customerDetails: customer || null,
            customerEmail: order.customerEmail,

            status: order.ready ? "ready" : "pending",
            stageIndex: Number(order.status) || 0,
            confirmed: Boolean(order.confirmed),
            items: Array.isArray(order.items) ? order.items : [],
            total: Number(order.total) || 0,
            date: order.date || order.createdAt || null,
            createdAt: order.date || order.createdAt || null,
            payMethod: order.payMethod || "",
            shipping: order.shipping || null,
          };
        });

        setOrders(normalized);
      });
    }

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isLoggedIn]);

  const [deliveries, setDeliveries] = useState([]);
  const [pendingStockRequestsCount, setPendingStockRequestsCount] = useState(0);
  const [returnRequests, setReturnRequests] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return;

    getAllReturnRequests().then(setReturnRequests);
  }, [isLoggedIn, activeView, refreshKey]);

  const [contactMessages, setContactMessages] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return;

    getAllContactMessages().then(setContactMessages);
  }, [isLoggedIn, activeView, refreshKey]);

  useEffect(() => {
    if (!isLoggedIn) return;

    getAllStockNotifications().then((items) => {
      setPendingStockRequestsCount(items.filter((item) => !item.notified).length);
    });
  }, [isLoggedIn, activeView, refreshKey]);

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

  const [currentPromotedCode, setCurrentPromotedCode] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    getFeaturedProduct().then((featured) => {
      setCurrentPromotedCode(featured?.code || null);
    });
  }, [isLoggedIn]);

  const alerts = useMemo(() => createAlerts(products, orders, dict.manager.alerts), [products, orders, dict]);

  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => !o.confirmed).length,
    [orders],
  );

  const pendingDeliveriesCount = useMemo(
    () => deliveries.filter((d) => (Number(d.status) || 0) < 3).length,
    [deliveries],
  );

  const pendingReturnsCount = useMemo(
    () => returnRequests.filter((r) => r.status === "pending").length,
    [returnRequests],
  );
  const unreadContactMessagesCount = useMemo(
    () => contactMessages.filter((m) => !m.read).length,
    [contactMessages],
  );
  const receipts = useMemo(() => {
    return orders.map((order) => ({
      id: order.id,
      date: order.date || order.createdAt || new Date().toISOString(),
      total: Number(order.total) || 0,
      items: Array.isArray(order.items) ? order.items : [],
    }));
  }, [orders]);
 

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
    setFeaturedProduct(product);
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
    const trimmedCode = code.trim().toUpperCase();
    const found = products.find((p) => p.code.toUpperCase() === trimmedCode);

    if (!found) {
      alertDialog(dict.manager.dialogs.barcodeNotFound.replace("{code}", trimmedCode));
      return;
    }

    setGlobalSearch(found.code);
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
}, [isLoggedIn, refreshKey]);
 

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
  function handleConfirmOrder(orderDocId) {
    confirmOrder(orderDocId);

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.docId === orderDocId ? { ...order, confirmed: true } : order
      )
    );

    const order = orders.find((o) => o.docId === orderDocId);
    if (order?.customerEmail) {
      sendShippingUpdateEmail({
        toEmail: order.customerEmail,
        orderId: order.id,
        stageIndex: 0,
      });
    }
  }

  function handleAdvanceOrderStage(orderDocId, nextIndex) {
    advanceOrderStatus(orderDocId, nextIndex);

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.docId === orderDocId ? { ...order, stageIndex: nextIndex } : order
      )
    );

    const order = orders.find((o) => o.docId === orderDocId);
    if (order?.customerEmail) {
      sendShippingUpdateEmail({
        toEmail: order.customerEmail,
        orderId: order.id,
        stageIndex: nextIndex,
      });
    }
  }

  const shellClassName = `${styles.appShell} ${
    lang === "he" ? styles.appShellRtl : styles.appShellLtr
  } ${theme === "light" ? styles.light : styles.dark}`;

  if (!isLoggedIn)
    return <LoginOverlay onLoginSuccess={() => setIsLoggedIn(true)} />;

  return (
    <div className={shellClassName}>
      <ManagerSidebar
        activeView={activeView}
        alertCount={alerts.length}
        pendingOrdersCount={pendingOrdersCount}
        pendingDeliveriesCount={pendingDeliveriesCount}
        pendingStockRequestsCount={pendingStockRequestsCount}
        pendingReturnsCount={pendingReturnsCount}
        unreadContactMessagesCount={unreadContactMessagesCount}
        onChangeView={(view) => {
          setActiveView(view);
          setMobileSidebarOpen(false);
        }}
        onLogout={async () => {
          const confirmed = await confirmDialog(dict.manager.dialogs.confirmLogout);
          if (!confirmed) return;
          setIsLoggedIn(false);
          setActiveView("overview");
          navigate("/");
        }}
        onGoHome={async () => {
          const confirmed = await confirmDialog(dict.manager.dialogs.confirmGoHome);
          if (!confirmed) return;
          navigate("/");
        }}
        onToggleTheme={handleToggleTheme}
        theme={theme}
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
          onRefresh={() => {
            setRefreshKey((prev) => prev + 1);
            contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onAddProductClick={() => setIsAddProductOpen(true)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenScan={() => setIsScanOpen(true)}
          onCancelPromote={handleCancelPromote}
        />

        <div className={styles.content} ref={contentRef}>
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
              onConfirmOrder={handleConfirmOrder}
            />
          )}
          {activeView === "deliveries" && (
            <ManagerDeliveries
              orders={orders}
              onAdvanceStatus={handleAdvanceOrderStage}
            />
          )}
         

          {activeView === "receipts" && <ReceiptsView receipts={receipts} />}
          {activeView === "analytics" && (
            <AnalyticsView orders={orders} products={products} returnRequests={returnRequests} />
          )}
          {activeView === "feedback" && <FeedbackView />}
          {activeView === "stockNotifications" && <StockNotificationsView />}
          {activeView === "returns" && <ManagerReturns />}
          {activeView === "contactMessages" && <ManagerContactMessages />}
          {activeView === "coupons" && <CouponsView />}
          {activeView === "settings" && <SettingsView />}
        </div>
      </div>

      <AddProductModal
        isOpen={isAddProductOpen}
        theme={theme}
        products={products}
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
        onSave={async (updated) => {
          const previousStock = Number(selectedProduct?.stock) || 0;
          const newStock = Number(updated.stock) || 0;

          updateProduct(updated);

          if (previousStock <= 0 && newStock > 0) {
            const resolvedEntries = await resolveStockNotifications(updated.code);

            resolvedEntries.forEach((entry) => {
              if (entry.email) {
                sendStockAlertEmail({
                  toEmail: entry.email,
                  productName: entry.productName || updated.name,
                });
              }
            });
          }

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