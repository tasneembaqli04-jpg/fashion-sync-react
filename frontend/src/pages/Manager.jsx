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
import { createAlerts, HIGH_DEMAND_THRESHOLD } from "../functions/manager/managerHelpers";
import { getProducts, addProduct, deleteProduct, updateProduct } from "../services/products/productsService";
import { translateProductFields } from "../services/translation/translationService";
import { resolveStockNotifications, getAllStockNotifications } from "../services/notifications/notificationsService";
import { getAllReturnRequests } from "../services/returns/returnsService";
import { getAllContactMessages } from "../services/contact/contactMessagesService";
import { subscribeToOrders, updateOrderCustomerAndItems, advanceOrderStatus, confirmOrder, rejectOrder } from "../services/orders/ordersService";
import { updateContactMessageTranslation } from "../services/contact/contactMessagesService";
import { getAllFeedback, updateFeedbackTranslation } from "../services/feedback/feedbackService";
import { translateText, keepPersonName } from "../services/translation/translationService";
import { translateProductName } from "../services/translation/translationService";
import { activateGiftCard, rejectGiftCard } from "../services/giftcard/giftCardService";
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
import { sendShippingUpdateEmail, sendStockAlertEmail, sendGiftCardActivatedEmail, sendOrderRejectedEmail, sendGiftCardRejectedEmail } from "../services/email/emailService";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { logOut } from "../services/auth/firebaseAuth";
import { getStockStatus } from "../functions/customer/stockPolicy";
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
      if (user && user.email === "manager@fashionsync-internal.com") {
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
    let customersMap = new Map();

    getAllCustomers().then((customers) => {
      customersMap = new Map(
        customers.map((customer) => [customer.email, customer])
      );

      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          customerDetails: customersMap.get(order.customerEmail) || order.customerDetails,
        })),
      );
    });

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
          rejected: Boolean(order.rejected),
          rejectedAt: order.rejectedAt || null,
          deliveredAt: order.deliveredAt || null,
          pickupDate: order.pickupDate || "",
          pickupTime: order.pickupTime || "",
        };
      });

      setOrders(normalized);
      setOrdersLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
   }, [isLoggedIn, refreshKey]);

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
      (p) => getStockStatus(p.stock, p.minStock) !== "available",
    ).length;
    const demandCount = products.filter((p) => {
      if (getStockStatus(p.stock, p.minStock) !== "out") return false;
      const requestCount = stockNotifications.filter(
        (n) => n.productCode === p.code
      ).length;
      return requestCount > HIGH_DEMAND_THRESHOLD;
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

  function needsTranslation(original, translated) {
    if (!original) return false;
    if (!translated) return true;
    return translated.trim() === original.trim();
  }

  // Person names are never translated: the English field mirrors the name (see
  // keepPersonName). An English value equal to the Hebrew one is therefore the
  // finished state, not a failed translation, and needsTranslation would read
  // it as failure and re-attempt it on every sweep for ever.
  //
  // A name field is outstanding only while its English counterpart is empty,
  // which is the case for records written before the mirror existed. Filling
  // it once settles it permanently.
  function needsPersonNameFill(original, translated) {
    return Boolean(original) && !translated;
  }

  const failedTranslationsCount = useMemo(() => {
    let count = 0;

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        if (needsTranslation(item.name, item.nameEn)) count += 1;
        if (item.isGiftCard) {
          if (needsPersonNameFill(item.giftRecipient, item.giftRecipientEn)) count += 1;
          if (needsTranslation(item.giftMessage, item.giftMessageEn)) count += 1;
        }
      });

      const customer = order.customerEmbedded || order.customerDetails;
      if (customer) {
        if (needsPersonNameFill(customer.name, customer.nameEn)) count += 1;
        if (needsTranslation(customer.city, customer.cityEn)) count += 1;
        if (needsTranslation(customer.street, customer.streetEn)) count += 1;
      }
    });

    contactMessages.forEach((m) => {
      if (needsPersonNameFill(m.name, m.nameEn)) count += 1;
      if (needsTranslation(m.message, m.messageEn)) count += 1;
    });

    feedbackList.forEach((f) => {
      if (needsTranslation(f.text, f.textEn)) count += 1;
    });

    customersList.forEach((c) => {
      if (needsPersonNameFill(c.name, c.nameEn)) count += 1;
      if (needsTranslation(c.city, c.cityEn)) count += 1;
      if (needsTranslation(c.street, c.streetEn)) count += 1;
    });

    products.forEach((p) => {
      if (needsTranslation(p.name, p.nameEn)) count += 1;
      if (needsTranslation(p.desc, p.descEn)) count += 1;
      (p.variants || []).forEach((v) => {
        if (needsTranslation(v.colorName, v.colorNameEn)) count += 1;
      });
    });

    return count;
  }, [orders, contactMessages, feedbackList, customersList, products]);

  async function handleTranslateHistoricalData() {
    setTranslatingHistorical(true);

    const ordersNeedingUpdate = orders.filter((order) => {
      const itemsNeedUpdate = (order.items || []).some(
        (item) =>
          needsTranslation(item.name, item.nameEn) ||
          (item.isGiftCard &&
            (needsPersonNameFill(item.giftRecipient, item.giftRecipientEn) ||
              needsTranslation(item.giftMessage, item.giftMessageEn)))
      );

      const customer = order.customerEmbedded || order.customerDetails;
      const addressNeedsUpdate =
        customer &&
        (needsTranslation(customer.city, customer.cityEn) ||
          needsTranslation(customer.street, customer.streetEn) ||
          needsPersonNameFill(customer.name, customer.nameEn));

      return itemsNeedUpdate || addressNeedsUpdate;
    });

    const messagesNeedingUpdate = contactMessages.filter(
      (m) => needsPersonNameFill(m.name, m.nameEn) || needsTranslation(m.message, m.messageEn)
    );

    const allFeedback = await getAllFeedback();
    const feedbackNeedingUpdate = allFeedback.filter(
      (f) => needsTranslation(f.text, f.textEn)
    );

    const allCustomers = await getAllCustomers();
    const customersNeedingUpdate = allCustomers.filter(
      (c) =>
        needsPersonNameFill(c.name, c.nameEn) ||
        needsTranslation(c.city, c.cityEn) ||
        needsTranslation(c.street, c.streetEn)
    );

    const productsNeedingUpdate = products.filter((p) => {
      const nameNeedsUpdate = needsTranslation(p.name, p.nameEn);
      const descNeedsUpdate = needsTranslation(p.desc, p.descEn);
      const colorsNeedUpdate = (p.variants || []).some((v) =>
        needsTranslation(v.colorName, v.colorNameEn),
      );
      return nameNeedsUpdate || descNeedsUpdate || colorsNeedUpdate;
    });

    const total =
      ordersNeedingUpdate.length +
      messagesNeedingUpdate.length +
      feedbackNeedingUpdate.length +
      customersNeedingUpdate.length +
      productsNeedingUpdate.length;

    setHistoricalProgress({ done: 0, total });
    let done = 0;

    for (const order of ordersNeedingUpdate) {
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

      done += 1;
      setHistoricalProgress({ done, total });
    }

    for (const feedbackItem of feedbackNeedingUpdate) {
      const textEn = await translateText(feedbackItem.text);
      await updateFeedbackTranslation(feedbackItem.id, textEn || feedbackItem.textEn || feedbackItem.text);

      done += 1;
      setHistoricalProgress({ done, total });
    }

    for (const customer of customersNeedingUpdate) {
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

      done += 1;
      setHistoricalProgress({ done, total });
    }

    for (const product of productsNeedingUpdate) {
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

      done += 1;
      setHistoricalProgress({ done, total });
    }

    setTranslatingHistorical(false);
    setRefreshKey((k) => k + 1);
  }

  function handleConfirmOrder(orderDocId) {
    confirmOrder(orderDocId);

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.docId === orderDocId ? { ...order, confirmed: true } : order
      )
    );

    const order = orders.find((o) => o.docId === orderDocId);
    const giftCardItems = (order?.items || []).filter((item) => item.isGiftCard);

    if (giftCardItems.length > 0) {
      giftCardItems.forEach((item) => {
        activateGiftCard(item.code);
      });

      if (order?.customerEmail) {
        sendGiftCardActivatedEmail({
          toEmail: order.customerEmail,
          giftCardCode: giftCardItems[0].code,
          amount: giftCardItems[0].price,
          lang,
        });
      }

      return;
    }

    if (order?.customerEmail) {
      sendShippingUpdateEmail({
        toEmail: order.customerEmail,
        orderId: order.id,
        stageIndex: 0,
        lang,
      });
    }
  }

  function handleRejectOrder(orderDocId) {
    rejectOrder(orderDocId);

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.docId === orderDocId ? { ...order, rejected: true } : order
      )
    );

    const order = orders.find((o) => o.docId === orderDocId);
    const giftCardItems = (order?.items || []).filter((item) => item.isGiftCard);

    if (giftCardItems.length > 0) {
      giftCardItems.forEach((item) => {
        rejectGiftCard(item.code);
      });

      if (order?.customerEmail) {
        sendGiftCardRejectedEmail({
          toEmail: order.customerEmail,
          lang,
        });
      }

      return;
    }

    if (order?.customerEmail) {
      sendOrderRejectedEmail({
        toEmail: order.customerEmail,
        orderId: order.id,
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