import { useEffect, useMemo, useRef, useState } from "react";
import ErrorBoundary from "../components/common/ErrorBoundary";
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
import { createAlerts, HIGH_DEMAND_THRESHOLD } from "../functions/manager/managerHelpers";
import { getProducts, addProduct, deleteProduct, updateProduct } from "../services/products/productsService";
import { translateProductFields } from "../services/translation/translationService";
import { resolveStockNotifications, getAllStockNotifications, updateStockNotificationTranslation } from "../services/notifications/notificationsService";
import { getAllReturnRequests, updateReturnItemTranslation } from "../services/returns/returnsService";
import { matchesAnySearchField } from "../functions/shared/textSearch";
import { calculateMonthlyStats } from "../functions/manager/analytics";
import { getAllContactMessages } from "../services/contact/contactMessagesService";
import { updateOrderCustomerAndItems } from "../services/orders/ordersService";
import { updateContactMessageTranslation } from "../services/contact/contactMessagesService";
import { getAllFeedback, updateFeedbackTranslation } from "../services/feedback/feedbackService";
import { translateText, keepPersonName } from "../services/translation/translationService";
import { translateProductName } from "../services/translation/translationService";
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
import { sendStockAlertEmail } from "../services/email/emailService";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { logOut } from "../services/auth/firebaseAuth";
import { getStockStatus } from "../functions/customer/stockPolicy";
import { getNotificationSettings } from "../services/settings/notificationSettingsService";
import {
  needsTranslation,
  needsPersonNameFill,
  countOutstandingTranslations,
  selectRecordsNeedingTranslation,
  resolveCatalogueNameEn,
} from "../functions/manager/historicalTranslation";
import { useDialog } from "../components/common/DialogProvider";
import { useLanguage } from "../translations/LanguageProvider";
import { useManagerOrders } from "../hooks/useManagerOrders";

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
      if (user && user.email === "fashionsyncmanager@gmail.com") {
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

  // Every order, with its subscription and the decisions taken on it. Placed
  // after isLoggedIn and refreshKey, both of which it reads.
  const {
    orders,
    ordersLoading,
    pendingOrdersCount,
    pendingDeliveriesCount,
    receipts,
    handleConfirmOrder,
    handleRejectOrder,
    handleAdvanceOrderStage,
    applyOrderTranslation,
  } = useManagerOrders({ isLoggedIn, refreshKey });

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

  const [customersList, setCustomersList] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return;

    getAllCustomers().then(setCustomersList);
  }, [isLoggedIn, activeView, refreshKey]);

  useEffect(() => {
    if (!isLoggedIn) return;

    getAllStockNotifications().then((items) => {
      setPendingStockRequestsCount(items.filter((item) => !item.notified).length);
      setStockNotifications(items);
    });
  }, [isLoggedIn, activeView, refreshKey]);


  const [currentPromotedCode, setCurrentPromotedCode] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    getFeaturedProduct().then((featured) => {
      setCurrentPromotedCode(featured?.code || null);
    });
  }, [isLoggedIn]);

  // The alert preferences the manager set in Settings. Until they load, the
  // empty object leaves every alert on, which is what createAlerts defaults to.
  const [notificationSettings, setNotificationSettings] = useState({});

  useEffect(() => {
    if (!isLoggedIn) return;
    getNotificationSettings().then(setNotificationSettings);
  }, [isLoggedIn, refreshKey]);

  const alerts = useMemo(
    () =>
      createAlerts(
        products,
        orders,
        dict.manager.alerts,
        lang,
        stockNotifications,
        notificationSettings,
      ),
    [products, orders, dict, lang, stockNotifications, notificationSettings],
  );

  const pendingReturnsCount = useMemo(
    () => returnRequests.filter((r) => r.status === "pending").length,
    [returnRequests],
  );
  const unreadContactMessagesCount = useMemo(
    () => contactMessages.filter((m) => !m.read).length,
    [contactMessages],
  );
  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowCount = products.filter(
      (p) => getStockStatus(p.stock, p.minStock) !== "available",
    ).length;
    const demandCount = products.filter((p) => {
      if (getStockStatus(p.stock, p.minStock) !== "out") return false;
      const requestCount = stockNotifications.filter(
        (n) => n.productCode === p.code
      ).length;
      return requestCount > HIGH_DEMAND_THRESHOLD;
    }).length;
    // The sales figure comes from the analytics calculation rather than from
    // a second sum written here. Two screens both labelled "sales" that could
    // not agree was the fault being closed: this one totalled every order ever
    // placed, delivery fees included, while the analytics screen reported one
    // month of goods revenue net of returns. There is now one number.
    const monthly = calculateMonthlyStats({
      orders,
      products,
      returnRequests,
      otherCategoryLabel: dict.manager.analytics.otherCategory,
    });

    return {
      totalStock,
      lowCount,
      demandCount,
      // monthRevenue is already net of approved returns — the calculation
      // returns the adjusted figure under that name, which is the same number
      // the analytics screen prints.
      sales: monthly.monthRevenue,
      productCount: products.length,
      receiptCount: monthly.salesCount,
    };
  }, [products, orders, returnRequests, stockNotifications, dict]);

  const filteredProducts = useMemo(() => {
    if (!globalSearch.trim()) return products;

    // Both names and the code go through the shared matcher, which folds case
    // and looks in every name a product has. Category and season stay as they
    // are: they are stored as keys rather than as text the manager reads, and
    // each screen translates them for display.
    return products.filter(
      (p) =>
        matchesAnySearchField(globalSearch, p.name, p.nameEn, p.code) ||
        p.cat.includes(globalSearch.trim()) ||
        (p.season || "").includes(globalSearch.trim()),
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
    setPromoMessage({ kind: "promoted", productName: product.name });
    setIsPromoOpen(false);
    setTimeout(() => setSelectedProduct(null), 0);
    setTimeout(() => setPromoMessage(null), 3000);
  };

  const handleCancelPromote = () => {
    clearFeaturedProduct();
    setCurrentPromotedCode(null);
    if (onPromote) onPromote(null);
    setPromoMessage({ kind: "cancelled" });
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
  // null until the sweep has been run at least once. A run that finds nothing
  // sets { total: 0 }, which has to stay distinguishable from "never run" so
  // the screen can confirm the sweep happened rather than staying silent.
  const [historicalProgress, setHistoricalProgress] = useState(null);


  const failedTranslationsCount = useMemo(
    () =>
      countOutstandingTranslations({
        orders,
        contactMessages,
        feedback: feedbackList,
        customers: customersList,
        products,
        returns: returnRequests,
        stockAlerts: stockNotifications,
      }),
    [
      orders,
      contactMessages,
      feedbackList,
      customersList,
      products,
      returnRequests,
      stockNotifications,
    ],
  );

  async function handleTranslateHistoricalData() {
    setTranslatingHistorical(true);

    let done = 0;
    let failed = 0;
    let total = 0;

    /**
     * Runs one record's update and advances the progress counter.
     *
     * The sweep talks to a translation API and to Firestore for every record,
     * so a single unreachable call is expected rather than exceptional. Each
     * record is therefore isolated: a failure costs that record, is counted,
     * and the sweep carries on to the next. The counter advances either way,
     * so the progress shown always reaches the total it promised.
     */
    async function sweepRecord(describe, work) {
      try {
          await work();
    } catch (err) {
        failed += 1;
        console.warn(`${describe} left untranslated: ${err.message}`);
      }

      done += 1;
      setHistoricalProgress({ done, total, failed });
    }

    try {
      // These lists are re-read rather than taken from state, so the sweep works
      // from what Firestore holds right now.
      const [allFeedback, allCustomers, allReturns, allStockAlerts] =
        await Promise.all([
          getAllFeedback(),
          getAllCustomers(),
          getAllReturnRequests(),
          getAllStockNotifications(),
        ]);

      const {
        orders: ordersNeedingUpdate,
        messages: messagesNeedingUpdate,
        feedback: feedbackNeedingUpdate,
        customers: customersNeedingUpdate,
        products: productsNeedingUpdate,
        returns: returnsNeedingUpdate,
        stockAlerts: stockAlertsNeedingUpdate,
        total: totalNeedingUpdate,
      } = selectRecordsNeedingTranslation({
        orders,
        contactMessages,
        feedback: allFeedback,
        customers: allCustomers,
        products,
        returns: allReturns,
        stockAlerts: allStockAlerts,
      });

      total = totalNeedingUpdate;
      setHistoricalProgress({ done: 0, total, failed: 0 });

      for (const order of ordersNeedingUpdate) {
        await sweepRecord(`Order ${order.id || order.docId}`, async () => {
        const updatedItems = await Promise.all(
          (order.items || []).map(async (item) => {
            let nextItem = item;

            if (needsTranslation(nextItem.name, nextItem.nameEn)) {
              const product = products.find((p) => p.code === item.code);
              if (product?.nameEn && product.nameEn.trim() !== nextItem.name.trim()) {
                nextItem = { ...nextItem, nameEn: product.nameEn };
              } else {
                // An item name is a product name, so it goes through the fashion dictionary
                const nameEn = await translateProductName(nextItem.name);
                if (nameEn) nextItem = { ...nextItem, nameEn };
              }
            }

            if (nextItem.isGiftCard) {
              if (needsPersonNameFill(nextItem.giftRecipient, nextItem.giftRecipientEn)) {
                const giftRecipientEn = keepPersonName(nextItem.giftRecipient);
                if (giftRecipientEn) nextItem = { ...nextItem, giftRecipientEn };
              }
              if (needsTranslation(nextItem.giftMessage, nextItem.giftMessageEn)) {
                const giftMessageEn = await translateText(nextItem.giftMessage);
                if (giftMessageEn) nextItem = { ...nextItem, giftMessageEn };
              }
            }

            return nextItem;
          })
        );

        const existingCustomer = order.customerEmbedded || order.customerDetails || null;
        let updatedCustomer = existingCustomer;

        if (existingCustomer) {
          const needsNameEn = needsPersonNameFill(existingCustomer.name, existingCustomer.nameEn);
          const needsCityEn = needsTranslation(existingCustomer.city, existingCustomer.cityEn);
          const needsStreetEn = needsTranslation(existingCustomer.street, existingCustomer.streetEn);

          if (needsNameEn || needsCityEn || needsStreetEn) {
            const [nameEn, cityEn, streetEn] = await Promise.all([
              Promise.resolve(needsNameEn ? keepPersonName(existingCustomer.name) : existingCustomer.nameEn),
              needsCityEn ? translateText(existingCustomer.city) : Promise.resolve(existingCustomer.cityEn),
              needsStreetEn ? translateText(existingCustomer.street) : Promise.resolve(existingCustomer.streetEn),
            ]);

            updatedCustomer = {
              ...existingCustomer,
              nameEn: nameEn || existingCustomer.nameEn || existingCustomer.name,
              cityEn: cityEn || existingCustomer.cityEn || existingCustomer.city,
              streetEn: streetEn || existingCustomer.streetEn || existingCustomer.street,
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

        applyOrderTranslation(order.docId, {
          items: updatedItems,
          customerEmbedded: updatedCustomer,
        });
        });
      }

      for (const message of messagesNeedingUpdate) {
        await sweepRecord(`Message ${message.id}`, async () => {
        const needsNameEn = needsPersonNameFill(message.name, message.nameEn);
        const needsMessageEn = needsTranslation(message.message, message.messageEn);

        const [nameEn, messageEn] = await Promise.all([
          Promise.resolve(needsNameEn ? keepPersonName(message.name) : message.nameEn),
          needsMessageEn ? translateText(message.message || "") : Promise.resolve(message.messageEn),
        ]);

        const finalNameEn = nameEn || message.nameEn || message.name || "";
        const finalMessageEn = messageEn || message.messageEn || message.message || "";

        await updateContactMessageTranslation(message.id, {
          nameEn: finalNameEn,
          messageEn: finalMessageEn,
        });

        setContactMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, nameEn: finalNameEn, messageEn: finalMessageEn } : m))
        );
        });
      }

      for (const feedbackItem of feedbackNeedingUpdate) {
        await sweepRecord(`Feedback ${feedbackItem.id}`, async () => {
          const textEn = await translateText(feedbackItem.text);
          await updateFeedbackTranslation(feedbackItem.id, textEn || feedbackItem.textEn || feedbackItem.text);
        });
      }

      for (const customer of customersNeedingUpdate) {
        await sweepRecord(`Customer ${customer.email}`, async () => {
        if (needsTranslation(customer.name, customer.nameEn)) {
          const nameEn = keepPersonName(customer.name);
          await updateCustomerNameTranslation(customer.email, nameEn || customer.nameEn || customer.name);
        }

        const needsCityEn = needsTranslation(customer.city, customer.cityEn);
        const needsStreetEn = needsTranslation(customer.street, customer.streetEn);

        if (needsCityEn || needsStreetEn) {
          const [cityEn, streetEn] = await Promise.all([
            needsCityEn ? translateText(customer.city) : Promise.resolve(customer.cityEn),
            needsStreetEn ? translateText(customer.street) : Promise.resolve(customer.streetEn),
          ]);

          await updateCustomerAddressTranslation(customer.email, {
            cityEn: cityEn || customer.cityEn || customer.city,
            streetEn: streetEn || customer.streetEn || customer.street,
          });
        }
        });
      }

      for (const product of productsNeedingUpdate) {
        await sweepRecord(`Product ${product.code}`, async () => {
        let nextProduct = product;

        if (needsTranslation(product.name, product.nameEn)) {
          // Product names use the fashion dictionary, not the generic translator
          const nameEn = await translateProductName(product.name);
          if (nameEn) nextProduct = { ...nextProduct, nameEn };
        }

        if (needsTranslation(product.desc, product.descEn)) {
          const descEn = await translateText(product.desc);
          if (descEn) nextProduct = { ...nextProduct, descEn };
        }

        if (nextProduct.variants?.length) {
          const updatedVariants = await Promise.all(
            nextProduct.variants.map(async (variant) => {
              if (!needsTranslation(variant.colorName, variant.colorNameEn)) {
                return variant;
              }
              const colorNameEn = await translateProductFields({
                name: "",
                desc: "",
                colorNames: [variant.colorName],
              });
              const translated = colorNameEn.colorNamesEn?.[0];
              return translated ? { ...variant, colorNameEn: translated } : variant;
            }),
          );
          nextProduct = { ...nextProduct, variants: updatedVariants };
        }

        if (nextProduct !== product) {
          await updateProduct(nextProduct);
          setProducts((prev) =>
            prev.map((p) => (p.code === product.code ? nextProduct : p)),
          );
        }
        });
      }

      // Returns and stock alerts both name a product the catalogue already holds
      // a translation for, so the name is looked up rather than translated
      // again. Translation is the fallback, for a product since removed.
      for (const request of returnsNeedingUpdate) {
        await sweepRecord(`Return ${request.id}`, async () => {
          const fromCatalogue = resolveCatalogueNameEn(request.itemCode, products);
          const itemNameEn =
            fromCatalogue || (await translateProductName(request.itemName));

          if (itemNameEn) {
            await updateReturnItemTranslation(request.id, itemNameEn);
          }
        });
      }

      for (const alert of stockAlertsNeedingUpdate) {
        await sweepRecord(`Stock alert ${alert.id}`, async () => {
          const fromCatalogue = resolveCatalogueNameEn(alert.productCode, products);
          const productNameEn =
            fromCatalogue || (await translateProductName(alert.productName));

          if (productNameEn) {
            await updateStockNotificationTranslation(alert.id, productNameEn);
          }
        });
      }
    } catch (err) {
      // Reaching here means the sweep could not start or could not be
      // continued, rather than one record failing. Whatever was written before
      // the failure stands, and running again picks up what is left.
      console.warn(`Historical translation stopped early: ${err.message}`);
      setHistoricalProgress({ done, total, failed: failed + 1 });
    } finally {
      // Always released, so a failure cannot leave the button reading
      // "translating" until the screen is reloaded.
      setTranslatingHistorical(false);
      setRefreshKey((k) => k + 1);
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
        failedTranslationsCount={failedTranslationsCount}
        onChangeView={(view) => {
          setActiveView(view);
          setMobileSidebarOpen(false);
        }}
        onLogout={async () => {
          const confirmed = await confirmDialog(dict.manager.dialogs.confirmLogout);
          if (!confirmed) return;
          await logOut();
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
          {/*
            One boundary around the views, keyed on the active view: a screen
            that fails to render shows its message here while the sidebar and
            topbar keep working, and moving to another view clears it.
          */}
          <ErrorBoundary
            resetKey={activeView}
            title={dict.common.errorBoundaryTitle}
            message={dict.common.errorBoundaryMessage}
          >
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
              onRejectOrder={handleRejectOrder}
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
              failedTranslationsCount={failedTranslationsCount}
            />
          )}
          </ErrorBoundary>
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
              <strong>{dict.manager.promo.successTitle}</strong>
              <span>
                {" "}
                {promoMessage.kind === "promoted"
                  ? dict.manager.promo.productPromoted.replace(
                      "{name}",
                      promoMessage.productName,
                    )
                  : dict.manager.promo.promotionCancelled}
              </span>
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