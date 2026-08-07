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
import GiftCardOrdersView from "../components/manager/views/GiftCardOrdersView";
import ManagerDeliveries from "../components/manager/views/ManagerDeliveries";
import { createAlerts } from "../functions/manager/managerHelpers";
import { getProducts, addProduct, deleteProduct, updateProduct } from "../services/products/productsService";
import { translateProductFields } from "../services/translation/translationService";
import { resolveStockNotifications, getAllStockNotifications } from "../services/notifications/notificationsService";
import { getAllReturnRequests } from "../services/returns/returnsService";
import { getAllContactMessages } from "../services/contact/contactMessagesService";
import { subscribeToOrders, updateOrderStatus, updateOrderItems, updateOrderCustomerAndItems, advanceOrderStatus, confirmOrder } from "../services/orders/ordersService";
import { updateContactMessageTranslation } from "../services/contact/contactMessagesService";
import { getAllFeedback, updateFeedbackTranslation } from "../services/feedback/feedbackService";
import { translateText } from "../services/translation/translationService";
import {
  getAllDeliveries,
  addDelivery,
  updateDeliveryStatus,
  deleteDelivery,
} from "../services/deliveries/deliveriesService";
import { getAllCustomers, updateCustomerNameTranslation, updateCustomerAddressTranslation } from "../services/customer/customerFirestore";
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
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useDialog } from "../components/common/DialogProvider";
import { useLanguage } from "../translations/LanguageProvider";

export default function Manager({ onPromote }) {
  const navigate = useNavigate();
  const { confirmDialog, alertDialog } = useDialog();
  const { lang, t: dict } = useLanguage();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const contentRef = useRef(null);
  const shellRef = useRef(null);
  const [activeView, setActiveView] = useState("overview");
  const isPopStateRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const existingView = window.history.state?.view;

    if (existingView) {
      setActiveView(existingView);
    } else {
      window.history.replaceState({ view: "overview" }, "");
    }

    function handlePopState(event) {
      isPopStateRef.current = true;
      setActiveView(event.state?.view || "overview");
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }

    window.history.pushState({ view: activeView }, "");
  }, [activeView, isLoggedIn]);

  function goBackView() {
    setActiveView("overview");
    shellRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }
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
  const [stockRequestsProductFilter, setStockRequestsProductFilter] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

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
            customerEmbedded: order.customer || null,

            status: order.ready ? "ready" : "pending",
            stageIndex: Number(order.status) || 0,
            confirmed: Boolean(order.confirmed),
            items: Array.isArray(order.items) ? order.items : [],
            total: Number(order.total) || 0,
            subtotal: Number(order.subtotal) || 0,
            discountAmount: Number(order.discountAmount) || 0,
            shippingCost: Number(order.shippingCost) || 0,
            date: order.date || order.createdAt || null,
            createdAt: order.date || order.createdAt || null,
            payMethod: order.payMethod || "",
            shipping: order.shipping || null,
            cancelled: Boolean(order.cancelled),
            deliveredAt: order.deliveredAt || null,
            pickupDate: order.pickupDate || "",
            pickupTime: order.pickupTime || "",
          };
        });

        setOrders(normalized);
        setOrdersLoading(false);
      });
    }

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
   }, [isLoggedIn, refreshKey]);

  const [deliveries, setDeliveries] = useState([]);
  const [pendingStockRequestsCount, setPendingStockRequestsCount] = useState(0);
  const [stockNotifications, setStockNotifications] = useState([]);
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

  const [feedbackList, setFeedbackList] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return;

    getAllFeedback().then(setFeedbackList);
  }, [isLoggedIn, activeView, refreshKey]);

  const unreadFeedbackCount = useMemo(
    () => feedbackList.filter((f) => !f.read).length,
    [feedbackList],
  );

  useEffect(() => {
    if (!isLoggedIn) return;

    getAllStockNotifications().then((items) => {
      setPendingStockRequestsCount(items.filter((item) => !item.notified).length);
      setStockNotifications(items);
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

  const alerts = useMemo(
    () => createAlerts(products, orders, dict.manager.alerts, lang, stockNotifications),
    [products, orders, dict, lang, stockNotifications],
  );

  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => !o.confirmed && !o.cancelled).length,
    [orders],
  );

  const pendingDeliveriesCount = useMemo(
    () =>
      orders.filter(
        (o) => o.confirmed && !o.cancelled && (Number(o.stageIndex) || 0) < 3,
      ).length,
    [orders],
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
      subtotal: Number(order.subtotal) || 0,
      discountAmount: Number(order.discountAmount) || 0,
      shippingCost: Number(order.shippingCost) || 0,
      payMethod: order.payMethod || "",
      shipping: order.shipping || null,
      customer: order.customerEmbedded || order.customerDetails || null,
      items: Array.isArray(order.items) ? order.items : [],
    }));
  }, [orders]);
 

  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowCount = products.filter(
      (p) => p.stock === 0 || (p.stock > 0 && p.stock <= p.minStock),
    ).length;
    const demandCount = products.filter((p) => {
      if (p.stock !== 0) return false;
      const requestCount = stockNotifications.filter(
        (n) => n.productCode === p.code
      ).length;
      return requestCount > 15;
    }).length;
    const sales = receipts.reduce((sum, r) => sum + r.total, 0);
    return {
      totalStock,
      lowCount,
      demandCount,
      sales,
      productCount: products.length,
      receiptCount: receipts.length,
    };
  }, [products, receipts, stockNotifications]);

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
  const [translatingHistorical, setTranslatingHistorical] = useState(false);
  const [historicalProgress, setHistoricalProgress] = useState({ done: 0, total: 0 });

  async function handleTranslateHistoricalData() {
    setTranslatingHistorical(true);

    const ordersNeedingUpdate = orders.filter((order) => {
      const itemsNeedUpdate = (order.items || []).some(
        (item) =>
          !item.nameEn ||
          (item.isGiftCard && (!item.giftRecipientEn || (item.giftMessage && !item.giftMessageEn)))
      );

      const customer = order.customerEmbedded || order.customerDetails;
      const addressNeedsUpdate =
        customer &&
        ((customer.city && !customer.cityEn) ||
          (customer.street && !customer.streetEn) ||
          (customer.name && !customer.nameEn));

      return itemsNeedUpdate || addressNeedsUpdate;
    });

    const messagesNeedingUpdate = contactMessages.filter(
      (m) => !m.nameEn || !m.messageEn
    );

    const allFeedback = await getAllFeedback();
    const feedbackNeedingUpdate = allFeedback.filter(
      (f) => f.text && !f.textEn
    );

    const allCustomers = await getAllCustomers();
    const customersNeedingUpdate = allCustomers.filter(
      (c) => (c.name && !c.nameEn) || (c.city && !c.cityEn) || (c.street && !c.streetEn)
    );

    const total =
      ordersNeedingUpdate.length +
      messagesNeedingUpdate.length +
      feedbackNeedingUpdate.length +
      customersNeedingUpdate.length;

    setHistoricalProgress({ done: 0, total });
    let done = 0;

    for (const order of ordersNeedingUpdate) {
      const updatedItems = await Promise.all(
        (order.items || []).map(async (item) => {
          let nextItem = item;

          if (!nextItem.nameEn) {
            const product = products.find((p) => p.code === item.code);
            if (product?.nameEn) {
              nextItem = { ...nextItem, nameEn: product.nameEn };
            }
          }

          if (nextItem.isGiftCard) {
            if (!nextItem.giftRecipientEn && nextItem.giftRecipient) {
              const giftRecipientEn = await translateText(nextItem.giftRecipient);
              nextItem = { ...nextItem, giftRecipientEn: giftRecipientEn || nextItem.giftRecipient };
            }
            if (nextItem.giftMessage && !nextItem.giftMessageEn) {
              const giftMessageEn = await translateText(nextItem.giftMessage);
              nextItem = { ...nextItem, giftMessageEn: giftMessageEn || nextItem.giftMessage };
            }
          }

          return nextItem;
        })
      );

      const existingCustomer = order.customerEmbedded || order.customerDetails || null;
      let updatedCustomer = existingCustomer;

      if (existingCustomer) {
        const needsNameEn = existingCustomer.name && !existingCustomer.nameEn;
        const needsCityEn = existingCustomer.city && !existingCustomer.cityEn;
        const needsStreetEn = existingCustomer.street && !existingCustomer.streetEn;

        if (needsNameEn || needsCityEn || needsStreetEn) {
          const [nameEn, cityEn, streetEn] = await Promise.all([
            needsNameEn ? translateText(existingCustomer.name) : Promise.resolve(existingCustomer.nameEn),
            needsCityEn ? translateText(existingCustomer.city) : Promise.resolve(existingCustomer.cityEn),
            needsStreetEn ? translateText(existingCustomer.street) : Promise.resolve(existingCustomer.streetEn),
          ]);

          updatedCustomer = {
            ...existingCustomer,
            nameEn: nameEn || existingCustomer.name,
            cityEn: cityEn || existingCustomer.city,
            streetEn: streetEn || existingCustomer.street,
          };
        }
      }

      if (order.docId) {
        await updateOrderCustomerAndItems(
          order.docId,
          updatedCustomer !== existingCustomer ? updatedCustomer : null,
          updatedItems
        );
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.docId === order.docId
            ? {
                ...o,
                items: updatedItems,
                customerEmbedded: updatedCustomer,
              }
            : o
        )
      );

      done += 1;
      setHistoricalProgress({ done, total });
    }

    for (const message of messagesNeedingUpdate) {
      const [nameEn, messageEn] = await Promise.all([
        message.nameEn ? Promise.resolve(message.nameEn) : translateText(message.name || ""),
        message.messageEn ? Promise.resolve(message.messageEn) : translateText(message.message || ""),
      ]);

      await updateContactMessageTranslation(message.id, {
        nameEn: nameEn || message.name || "",
        messageEn: messageEn || message.message || "",
      });

      setContactMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, nameEn, messageEn } : m))
      );

      done += 1;
      setHistoricalProgress({ done, total });
    }

    for (const feedbackItem of feedbackNeedingUpdate) {
      const textEn = await translateText(feedbackItem.text);
      await updateFeedbackTranslation(feedbackItem.id, textEn || feedbackItem.text);

      done += 1;
      setHistoricalProgress({ done, total });
    }

    for (const customer of customersNeedingUpdate) {
      if (customer.name && !customer.nameEn) {
        const nameEn = await translateText(customer.name);
        await updateCustomerNameTranslation(customer.email, nameEn || customer.name);
      }

      if ((customer.city && !customer.cityEn) || (customer.street && !customer.streetEn)) {
        const [cityEn, streetEn] = await Promise.all([
          customer.city && !customer.cityEn ? translateText(customer.city) : Promise.resolve(customer.cityEn),
          customer.street && !customer.streetEn ? translateText(customer.street) : Promise.resolve(customer.streetEn),
        ]);

        await updateCustomerAddressTranslation(customer.email, {
          cityEn: cityEn || customer.city,
          streetEn: streetEn || customer.street,
        });
      }

      done += 1;
      setHistoricalProgress({ done, total });
    }

    setTranslatingHistorical(false);
    setRefreshKey((k) => k + 1);
  }

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
        lang,
      });
    }
  }

  function handleAdvanceOrderStage(orderDocId, nextIndex, isPickup = false) {
    advanceOrderStatus(orderDocId, nextIndex, isPickup);

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
        isPickup,
        lang,
      });
    }
  }

  const shellClassName = `${styles.appShell} ${
    lang === "he" ? styles.appShellRtl : styles.appShellLtr
  } ${theme === "light" ? styles.light : styles.dark}`;

  if (checkingAuth) return null;

  if (!isLoggedIn)
    return <LoginOverlay onLoginSuccess={() => setIsLoggedIn(true)} />;

  return (
    <div className={shellClassName} ref={shellRef}>
      <ManagerSidebar
        activeView={activeView}
        alertCount={alerts.length}
        pendingOrdersCount={pendingOrdersCount}
        pendingDeliveriesCount={pendingDeliveriesCount}
        pendingStockRequestsCount={pendingStockRequestsCount}
        pendingReturnsCount={pendingReturnsCount}
        unreadContactMessagesCount={unreadContactMessagesCount}
        unreadFeedbackCount={unreadFeedbackCount}
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
          showBackButton={activeView !== "overview"}
          onGoBack={goBackView}
          onGlobalSearchChange={(val) => {
            setGlobalSearch(val);
            if (val.trim()) setActiveView("inventory");
          }}
          onRefresh={() => {
            setRefreshKey((prev) => prev + 1);
            shellRef.current?.scrollTo({ top: 0, behavior: "smooth" });
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
            <AlertsView
              alerts={alerts}
              products={products}
              onViewStockRequests={(code) => {
                setStockRequestsProductFilter(code);
                setActiveView("stockNotifications");
              }}
            />
          )}



          {activeView === "orders" && (
            <ManagerOrders
              orders={orders}
              onConfirmOrder={handleConfirmOrder}
              loading={ordersLoading}
            />
          )}
          {activeView === "giftCardOrders" && (
            <GiftCardOrdersView />
          )}
          {activeView === "deliveries" && (
            <ManagerDeliveries
              orders={orders}
              onAdvanceStatus={handleAdvanceOrderStage}
              loading={ordersLoading}
            />
          )}
         

          {activeView === "receipts" && <ReceiptsView receipts={receipts} />}
          {activeView === "analytics" && (
            <AnalyticsView orders={orders} products={products} returnRequests={returnRequests} />
          )}
          {activeView === "feedback" && <FeedbackView />}
          {activeView === "stockNotifications" && (
            <StockNotificationsView
              products={products}
              initialProductCode={stockRequestsProductFilter}
            />
          )}
          {activeView === "returns" && <ManagerReturns products={products} />}
          {activeView === "contactMessages" && <ManagerContactMessages />}
          {activeView === "coupons" && <CouponsView />}
          {activeView === "settings" && (
            <SettingsView
              onTranslateHistorical={handleTranslateHistoricalData}
              translatingHistorical={translatingHistorical}
              historicalProgress={historicalProgress}
            />
          )}
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