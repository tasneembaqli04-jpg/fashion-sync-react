import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/customer/Customer.module.scss";
import { getOrdersByUser } from "../services/orders/ordersService";
import { getFeaturedProduct } from "../services/settings/featuredProductService";
import { getWishlist, saveWishlist } from "../services/wishlist/wishlistService";
import { addFeedback } from "../services/feedback/feedbackService";
import { getLoyaltyPoints } from "../services/customer/customerFirestore";
import { requestStockNotification, getMyStockAlerts, markStockAlertSeen } from "../services/notifications/notificationsService";
import { LS_KEYS } from "../functions/checkout/checkoutStorage";
import { useDialog } from "../components/common/DialogProvider";
import { useLanguage } from "../translations/LanguageProvider";
import { getCoupon } from "../services/coupons/couponsService";
import { requestSmartTryOn } from "../services/tryOn/smartTryOnService";
import {
  applyTheme,
  getSavedTheme,
  toggleTheme as toggleThemeFn,
} from "../functions/customer/theme";
import {
  initAuth,
  doLogout as doLogoutFn,
  goHome as goHomeFn,
  goLogin,
  guestPrompt as guestPromptFn,
} from "../functions/customer/auth";
import { openDB } from "../functions/customer/storage";
import {
  loadProducts,
  filterProducts,
  getSeasonMeta,
  getCurrentSeason,
} from "../functions/customer/catalog";
import {
  loadCart,
  loadCartFromBackend,
  addToCart as addToCartFn,
  changeQty as changeQtyFn,
  removeItem as removeItemFn,
  getCartCount,
  getCartTotals,
} from "../functions/customer/cart";
import { getReply } from "../functions/customer/chat";
import { requestChatReplyStream } from "../services/chat/chatService";
import {
  buildGiftCardPreview,
  buyGiftCard as buyGiftCardFn,
} from "../functions/customer/giftCard";
import { getGiftCard } from "../services/giftcard/giftCardService";
import CustomerTopbar from "../components/customer/CustomerTopbar";
import CustomerSidebar from "../components/customer/CustomerSidebar";
import CustomerChat from "../components/customer/CustomerChat";
import CustomerBrowse from "../components/customer/CustomerBrowse";
import CustomerWishlist from "../components/customer/CustomerWishlist";
import CustomerOrders from "../components/customer/CustomerOrders";
import ReturnRequestModal from "../components/customer/ReturnRequestModal";
import {
  requestReturn,
  getReturnRequestsByUser,
} from "../services/returns/returnsService";
import CustomerLoyalty from "../components/customer/CustomerLoyalty";
import CustomerGiftCard from "../components/customer/CustomerGiftCard";
import CustomerPolicy from "../components/customer/CustomerPolicy";
import ProductModal from "../components/customer/ProductModal";
import ShareModal from "../components/customer/ShareModal";
import CartDrawer from "../components/customer/CartDrawer";
import PreCheckoutFeedback from "../components/customer/PreCheckoutFeedback";
import VisualSearchModal from "../components/customer/VisualSearchModal";

export default function Customer() {
  const navigate = useNavigate();
  const { confirmDialog, alertDialog } = useDialog();
  const { t: dict } = useLanguage();

  const [theme, setTheme] = useState(getSavedTheme());
  const [activePanel, setActivePanel] = useState("browse");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  const [products, setProducts] = useState([]);
  const [featuredCode, setFeaturedCode] = useState("");
  const [cart, setCart] = useState(loadCart());

  const [searchValue, setSearchValue] = useState("");
  const [genderValue, setGenderValue] = useState("");
  const [categoryValue, setCategoryValue] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [saleValue, setSaleValue] = useState("");
  const [currentSeasonTab, setCurrentSeasonTab] = useState(getCurrentSeason());
  const [currentListMode, setCurrentListMode] = useState("all");

  const [chatInput, setChatInput] = useState("");
  const [moreQuestionsOpen, setMoreQuestionsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      type: "bot",
      html: `שלום! 👋 אני SYNC, העוזר החכם של FashionSync.<br />אני יכול לעזור לך למצוא בגדים, לבדוק מחירים, שעות פתיחה ועוד.<br />במה אוכל לעזור היום?`,
    },
  ]);
  const [isChatTyping, setIsChatTyping] = useState(false);

  const [wishlistCodes, setWishlistCodes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [rawStockAlerts, setRawStockAlerts] = useState([]);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProductCode, setSelectedProductCode] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [customSize, setCustomSize] = useState("");

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareItemName, setShareItemName] = useState("");
  const [shareProductCode, setShareProductCode] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [couponValue, setCouponValue] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [pointsInput, setPointsInput] = useState("");
  const [appliedPointsRedeemed, setAppliedPointsRedeemed] = useState(0);

  const [preCheckoutOpen, setPreCheckoutOpen] = useState(false);
  const [pcfRating, setPcfRating] = useState(0);
  const [pcfText, setPcfText] = useState("");
  const [pcfTopics, setPcfTopics] = useState([]);

  const [visualOpen, setVisualOpen] = useState(false);
  const [tryonSelfie, setTryonSelfie] = useState("");
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnResult, setTryOnResult] = useState(null);
  const [tryOnError, setTryOnError] = useState("");
  const tryOnAbortRef = useRef(null);
  
  const [giftAmount, setGiftAmount] = useState("100");
  const [giftCustomAmount, setGiftCustomAmount] = useState("");
  const [giftName, setGiftName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftPreviewCode, setGiftPreviewCode] = useState("—");
  const [giftError, setGiftError] = useState("");
  const [giftCheckCode, setGiftCheckCode] = useState("");
  const [giftCheckResult, setGiftCheckResult] = useState(null);
  const [giftCheckError, setGiftCheckError] = useState("");
  const [returnRequests, setReturnRequests] = useState([]);
  const [returnModalItem, setReturnModalItem] = useState(null);
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  useEffect(() => {
    if (!currentUser?.email) {
      setOrders([]);
      setLoyaltyPoints(0);
      setRawStockAlerts([]);
      setReturnRequests([]);
      return;
    }

    let cancelled = false;

    getOrdersByUser(currentUser.email).then((userOrders) => {
      if (!cancelled) {
        setOrders(userOrders.slice().reverse());
      }
    });

    getReturnRequestsByUser(currentUser.email).then((requests) => {
      if (!cancelled) {
        setReturnRequests(requests);
      }
    });

    getLoyaltyPoints(currentUser.email).then((points) => {
      if (!cancelled) {
        setLoyaltyPoints(points);
      }
    });

    getMyStockAlerts(currentUser.email).then((alerts) => {
      if (!cancelled) {
        setRawStockAlerts(alerts);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser, activePanel]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    async function init() {
      openDB();

      const auth = initAuth();

      if (!auth.mode) {
        navigate("/");
        return;
      }

      setCurrentUser(auth.currentUser || null);
      setIsGuest(Boolean(auth.isGuest));

      const products = await loadProducts();
      setProducts(products);

      const featured = await getFeaturedProduct();
      setFeaturedCode(featured?.code || "");

      const sharedItemCode = new URLSearchParams(window.location.search).get(
        "item"
      );
      if (sharedItemCode) {
        const sharedProduct = products.find(
          (p) => p.code === sharedItemCode
        );
        if (sharedProduct) {
          openProductModal(sharedItemCode);
        }
      }
    }

    init();
  }, [navigate]);
  useEffect(() => {
    if (!currentUser?.email || isGuest) {
      setCart([]);
      return;
    }

    let cancelled = false;

    async function loadUserCart() {
      const backendCart = await loadCartFromBackend(currentUser.email);

      if (!cancelled) {
        setCart(backendCart);
      }
    }

    loadUserCart();

    return () => {
      cancelled = true;
    };
  }, [currentUser, isGuest]);

  useEffect(() => {
    if (!currentUser?.email || isGuest) {
      setWishlistCodes([]);
      return;
    }

    let cancelled = false;

    getWishlist(currentUser.email).then((codes) => {
      if (!cancelled) {
        setWishlistCodes(codes);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser, isGuest]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.code === selectedProductCode) || null;
  }, [products, selectedProductCode]);

  const browseProducts = useMemo(() => {
    const filtered = filterProducts({
      products,
      search: searchValue.trim(),
      gender: genderValue,
      category: categoryValue,
      price: priceValue,
      sale: saleValue,
      seasonTab: currentSeasonTab,
      listMode: currentListMode,
      promotedCode: featuredCode,
    });

    return filtered.map((product) => ({
      ...product,
      wished: wishlistCodes.includes(product.code),
    }));
  }, [
    products,
    searchValue,
    genderValue,
    categoryValue,
    priceValue,
    saleValue,
    currentSeasonTab,
    currentListMode,
    wishlistCodes,
    featuredCode,
  ]);

  const wishlistProducts = useMemo(() => {
    return products
      .filter((product) => wishlistCodes.includes(product.code))
      .map((product) => ({ ...product, wished: true }));
  }, [products, wishlistCodes]);

  const stockAlerts = useMemo(() => {
    return rawStockAlerts.filter((alert) => {
      const product = products.find((p) => p.code === alert.productCode);
      return product && Number(product.stock) > 0;
    });
  }, [rawStockAlerts, products]);
  const activeOrdersCount = useMemo(
    () => orders.filter((o) => (Number(o.status) || 0) < 3).length,
    [orders],
  );

  const cartCount = getCartCount(cart);
  const pointsDiscountAmount = appliedPointsRedeemed * 0.05;
  const { total } = getCartTotals(cart, appliedDiscount, pointsDiscountAmount);

  const realCurrentSeason = getCurrentSeason();

  const seasonMeta = useMemo(() => {
    if (currentSeasonTab === "all") return null;

    const base = getSeasonMeta(dict.customer.browse)[currentSeasonTab];
    if (!base) return null;

    if (currentSeasonTab === realCurrentSeason) {
      return base;
    }

    const neutralTextByTab = {
      summer: dict.customer.browse.neutralSummer,
      winter: dict.customer.browse.neutralWinter,
      "spring-autumn": dict.customer.browse.neutralSpringAutumn,
    };

    return {
      ...base,
      text: neutralTextByTab[currentSeasonTab] || base.text,
    };
  }, [currentSeasonTab, realCurrentSeason]);

  const giftPreview = buildGiftCardPreview({
    amount: giftAmount,
    customAmount: giftCustomAmount,
    name: giftName,
    message: giftMessage,
  });

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function showPanel(panelName) {
    setActivePanel(panelName);
    closeSidebar();
  }

  function navProtected(panelName) {
    if (!isGuest) {
      setActivePanel(panelName);
      closeSidebar();
      return;
    }
    guestPrompt();
  }

  function handleToggleTheme() {
    toggleThemeFn(setTheme);
  }

  function quickMsg(text) {
    setChatInput(text);
    setTimeout(() => sendMsg(text), 0);
  }

  async function sendMsg(forcedText) {
    const text = (forcedText ?? chatInput).trim();
    if (!text) return;

    setChatMessages((prev) => [
      ...prev,
      {
        type: "user",
        html: text,
      },
    ]);

    setChatInput("");
    setIsChatTyping(true);

    const history = chatMessages.map((message) => ({
      role: message.type === "user" ? "user" : "bot",
      text: message.html || "",
    }));

    let botMessageStarted = false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      const result = await requestChatReplyStream({
        message: text,
        history,
        signal: controller.signal,

        onChunk: (fullTextSoFar) => {
          if (!botMessageStarted) {
            botMessageStarted = true;
            setIsChatTyping(false);

            setChatMessages((prev) => [
              ...prev,
              {
                type: "bot",
                html: fullTextSoFar,
              },
            ]);
          } else {
            setChatMessages((prev) => {
              const next = [...prev];

              next[next.length - 1] = {
                type: "bot",
                html: fullTextSoFar,
              };

              return next;
            });
          }
        },
      });

      if (
        result?.responseMode === "IMAGE" &&
        result?.imageGenerated === true &&
        result?.image?.dataUrl
      ) {
        setIsChatTyping(false);

        setChatMessages((prev) => [
          ...prev,
          {
            type: "bot",
            html: "הנה המחשת הלוק שביקשת:",
            imageUrl: result.image.dataUrl,
            imageMimeType: result.image.mimeType || "image/png",
            products: result.products || [],
          },
        ]);

        return;
      }

      if (
        result?.responseMode === "TEXT" &&
        result?.text &&
        !botMessageStarted
      ) {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "bot",
            html: result.text,
          },
        ]);
      }
    } catch (err) {
      console.error(
        "Real chat API failed, using fallback reply:",
        err
      );

      if (err?.name === "AbortError") {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "bot",
            html: "הבקשה לקחה יותר מדי זמן. נסי שוב.",
          },
        ]);

        return;
      }

      const fallbackReply = getReply(text, products);

      setChatMessages((prev) => [
        ...prev,
        {
          type: "bot",
          html: fallbackReply,
        },
      ]);
    } finally {
      clearTimeout(timeoutId);
      setIsChatTyping(false);
    }
  }

  function toggleMoreQuestions() {
    setMoreQuestionsOpen((prev) => !prev);
  }

  function toggleWish(code) {
    if (isGuest) {
      guestPrompt();
      return;
    }

    setWishlistCodes((prev) => {
      const next = prev.includes(code)
        ? prev.filter((item) => item !== code)
        : [...prev, code];

      if (currentUser?.email) {
        saveWishlist(currentUser.email, next);
      }

      return next;
    });
  }

  function openProductModal(code) {
    const product = products.find((item) => item.code === code);
    if (!product) return;

    const colorsFromVariants = product.variants
      ? product.variants.map((v) => v.colorName)
      : product.colors || [];

    setSelectedProductCode(code);
    setSelectedColor(colorsFromVariants[0] || "");
    setSelectedSize("");
    setCustomColor("");
    setCustomSize("");
    setProductModalOpen(true);
  }

  function closeProductModal() {
    setProductModalOpen(false);
  }

  function getChosenVariant() {
    return {
      size: selectedSize === "אחר" ? customSize || "אחר" : selectedSize,
      color: selectedColor === "אחר" ? customColor || "אחר" : selectedColor,
      isCustomSize: selectedSize === "אחר",
    };
  }

  async function addToCart(code, fromModal = false) {
    if (isGuest) {
      guestPrompt();
      return;
    }

    const product = products.find((item) => item.code === code);
    if (!product) return;

    if (fromModal && !selectedSize) return;

    const variant = fromModal ? getChosenVariant() : { size: "", color: "" };
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

    if (fromModal && hasVariants && selectedSize !== "אחר") {
      const matchingVariant = product.variants.find(
        (v) => v.colorName === variant.color
      );
      const availableQty = Number(matchingVariant?.sizes?.[variant.size]) || 0;

      if (availableQty <= 0) {
        alertDialog(dict.customer.dialogs.outOfStockSelection);
        return;
      }
    } else if (!hasVariants && product.stock <= 0) {
      return;
    }

    const nextCart = await addToCartFn({
      email: currentUser.email,
      cart,
      product,
      variant,
    });
    setCart(nextCart);

    if (fromModal) closeProductModal();
  }

  async function changeQty(key, delta) {
    const nextCart = await changeQtyFn(
      cart,
      key,
      delta,
      products,
      currentUser.email,
    );
    setCart(nextCart);
  }

  async function removeItem(key) {
    const nextCart = await removeItemFn(cart, key, currentUser.email);
    setCart(nextCart);
  }

  function openCartOrAuth() {
    if (isGuest) {
      guestPrompt();
      return;
    }
    setCartOpen(true);
  }

  function closeCart() {
    setCartOpen(false);
  }

  async function applyCoupon() {
    const code = couponValue.trim().toUpperCase();
    const coupon = await getCoupon(code);

    if (!coupon || !coupon.active) {
      alertDialog(dict.customer.dialogs.invalidCoupon);
      return;
    }

    if (coupon.seasonOnly && getCurrentSeason() !== coupon.seasonOnly) {
      alertDialog(dict.customer.dialogs.couponSeasonOnly);ד
      return;
    }

    setAppliedDiscount(coupon.discount);
    localStorage.setItem(LS_KEYS.DISCOUNT, String(coupon.discount));
    localStorage.setItem(LS_KEYS.COUPON_CODE, coupon.code);
  }
  function applyPointsRedemption() {
    const requested = parseInt(pointsInput, 10) || 0;

    if (requested <= 0) {
      alertDialog(dict.customer.dialogs.invalidPointsInput);
      return;
    }

    if (requested > loyaltyPoints) {
      alertDialog(dict.customer.dialogs.insufficientPoints.replace("{points}", loyaltyPoints.toLocaleString()));
      return;
    }

    const { raw, discount } = getCartTotals(cart, appliedDiscount);
    const afterCoupon = Math.max(0, raw - discount);
    const maxPointsUsable = Math.floor(afterCoupon / 0.05);

    if (maxPointsUsable <= 0) {
      alertDialog(dict.customer.dialogs.cartAlreadyCovered);
      return;
    }

    const finalPoints = Math.min(requested, maxPointsUsable);

    setAppliedPointsRedeemed(finalPoints);
    localStorage.setItem(LS_KEYS.POINTS_REDEEMED, String(finalPoints));
  }

  function removePointsRedemption() {
    setAppliedPointsRedeemed(0);
    setPointsInput("");
    localStorage.removeItem(LS_KEYS.POINTS_REDEEMED);
  }

  function startCheckout() {
    if (!cart.length) {
      alertDialog(dict.customer.dialogs.emptyCart);
      return;
    }

    setCartOpen(false);
    setPcfRating(0);
    setPcfText("");
    setPcfTopics([]);
    setPreCheckoutOpen(true);
  }

  function togglePcfTopic(topic) {
    setPcfTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((item) => item !== topic)
        : [...prev, topic],
    );
  }

  function submitPreCheckoutFeedback() {
    addFeedback({
      type: "pre-checkout",
      user: currentUser?.email || dict.customer.misc.guestFallbackName,
      rating: pcfRating,
      topics: pcfTopics,
      text: pcfText.trim(),
    });

    setPreCheckoutOpen(false);
    navigate("/checkout");
  }

  function skipToCheckout() {
    setPreCheckoutOpen(false);
    navigate("/checkout");
  }

  function openShareModal(code) {
    const product = products.find((item) => item.code === code);
    if (!product) return;

    setShareProductCode(code);
    setShareItemName(`${product.name} · ₪${product.price}`);
    setShareCopied(false);
    setShareModalOpen(true);
  }

  function closeShareModal() {
    setShareModalOpen(false);
  }

  function doShare(type) {
    const product = products.find((item) => item.code === shareProductCode);
    if (!product) return;

    const url = `${window.location.origin}/customer?item=${product.code}`;
    const text = dict.customer.misc.shareMessageTemplate
      .replace("{name}", product.name)
      .replace("{price}", product.price);

    if (type === "copy") {
      navigator.clipboard?.writeText(url);
      setShareCopied(true);
    } else if (type === "whatsapp") {
      window.open(
        "https://wa.me/?text=" + encodeURIComponent(`${text} ${url}`),
        "_blank",
      );
    } else if (type === "email") {
      window.location.href =
        "mailto:?subject=" +
        encodeURIComponent(dict.customer.misc.shareEmailSubjectPrefix + product.name) +
        "&body=" +
        encodeURIComponent(text + "\n" + url);
    }
  }

  async function openNotifyModal(code) {
    if (isGuest) {
      guestPrompt();
      return;
    }

    const product = products.find((item) => item.code === code);
    if (!product) return;

    const confirmed = await confirmDialog(
      dict.customer.dialogs.notifyConfirmMessage
        .replace("{email}", currentUser?.email || "")
        .replace("{name}", product.name)
    );
    if (!confirmed) return;

    requestStockNotification({
      productCode: product.code,
      productName: product.name,
      email: currentUser?.email || "",
    });

    alertDialog(
      dict.customer.dialogs.notifySuccessMessage.replace("{email}", currentUser?.email || "")
    );
  }

  function openVisualModal() {
    setVisualOpen(true);
  }

  function closeVisualModal() {
    tryOnAbortRef.current?.abort();
    tryOnAbortRef.current = null;

    setTryOnLoading(false);
    setTryOnError("");
    setVisualOpen(false);
  }

  function tryOnSelfieUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setTryonSelfie(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function clearTryonSelfie() {
    setTryonSelfie("");
  }
  async function handleTryOnRequest() {
    if (!tryonSelfie) {
      setTryOnError(dict.customer.dialogs.tryOnErrorUploadImage);
      return;
    }

    const productForTryOn = products.find(
      (product) =>
        String(product.code) === String(selectedProductCode)
    );

    if (!productForTryOn) {
      setTryOnError(dict.customer.dialogs.tryOnErrorProductNotFound);
      return;
    }

  
    tryOnAbortRef.current?.abort();

    const controller = new AbortController();
    tryOnAbortRef.current = controller;

    setTryOnLoading(true);
    setTryOnError("");
    setTryOnResult(null);

    try {
      const result = await requestSmartTryOn({
        product: productForTryOn,
        imageUrl: tryonSelfie,
        signal: controller.signal,
      });

    
      if (controller.signal.aborted) return;

      setTryOnResult(result);
    } catch (error) {
      if (error?.name === "AbortError") {
        console.log("Try On request cancelled");
        return;
      }
    

    console.error("Try On request failed:", error);

    setTryOnError(
      error?.message || dict.customer.dialogs.tryOnErrorGeneric
    );
    } finally {
    
      if (tryOnAbortRef.current === controller) {
        tryOnAbortRef.current = null;
        setTryOnLoading(false);
      }
    }
  }


  function openTryOnFromProduct(code) {
    setSelectedProductCode(code);
    setVisualOpen(true);
    setTryOnResult(null);
    setTryOnError("");
  }

  function handleGcAmountChange(value) {
    setGiftAmount(value);
  }

  function updateGiftPreview() {}
  async function checkGiftCardBalance() {
    const code = giftCheckCode.trim();
    setGiftCheckError("");
    setGiftCheckResult(null);

    if (!code) {
      setGiftCheckError(dict.customer.misc.giftCheckErrorEmptyCode);
      return;
    }

    const card = await getGiftCard(code);

    if (!card) {
      setGiftCheckError(dict.customer.misc.giftCheckErrorNotFound);
      return;
    }

    setGiftCheckResult(card);
  }

  async function buyGiftCard() {
    const result = await buyGiftCardFn({
      amount: giftAmount,
      customAmount: giftCustomAmount,
      name: giftName,
      message: giftMessage,
      email: currentUser?.email,
      cart,
    });

    if (!result.ok) {
      setGiftError(result.error);
      return;
    }

    setGiftError("");
    setGiftPreviewCode(result.code);
    setCart(result.nextCart);
    navigate("/checkout");
  }
  async function dismissStockAlert(id) {
    await markStockAlertSeen(id);
    setRawStockAlerts((prev) => prev.filter((item) => item.id !== id));
  }

  function handleLogout() {
    doLogoutFn(setCart, dict.customer.dialogs);
  }

  function openReturnRequestModal(order, item) {
    setReturnModalOrder(order);
    setReturnModalItem(item);
  }

  function closeReturnRequestModal() {
    setReturnModalOrder(null);
    setReturnModalItem(null);
  }

  async function submitReturnRequest({ reason, note }) {
    if (!returnModalOrder || !returnModalItem) return;

    await requestReturn({
      orderDocId: returnModalOrder.docId,
      orderId: returnModalOrder.id,
      itemCode: returnModalItem.code,
      itemName: returnModalItem.name,
      itemImg: returnModalItem.img,
      qty: returnModalItem.qty,
      customerEmail: currentUser?.email || "",
      customerName: currentUser?.name || "",
      reason,
      note,
    });

    const updated = await getReturnRequestsByUser(currentUser.email);
    setReturnRequests(updated);
    closeReturnRequestModal();
    alertDialog(dict.customer.returns.submitSuccess);
  }

  function guestPrompt() {
    return guestPromptFn(dict.customer.dialogs);
  }

  function goHome() {
    return goHomeFn(dict.customer.dialogs);
  }

  function copyCoupon(code, buttonEl) {
    navigator.clipboard?.writeText(code);

    if (!buttonEl) return;

    const original = buttonEl.textContent;
    buttonEl.textContent = dict.customer.misc.copiedButtonText;
    buttonEl.style.background = "linear-gradient(135deg,var(--green),#2ecc71)";

    setTimeout(() => {
      buttonEl.textContent = original;
      buttonEl.style.background = "";
    }, 1800);
  }

  return (
    <>
      <CustomerTopbar
        cartCountMobile={cartCount}
        toggleSidebar={toggleSidebar}
        openCartOrAuth={openCartOrAuth}
      />

      <CustomerSidebar
        activePanel={activePanel}
        isGuest={isGuest}
        currentUser={currentUser}
        sidebarOpen={sidebarOpen}
        toggleTheme={handleToggleTheme}
        goHome={goHome}
        goLogin={goLogin}
        doLogout={handleLogout}
        showPanel={showPanel}
        navProtected={navProtected}
        closeSidebar={closeSidebar}
        stockAlertsCount={stockAlerts.length}
        activeOrdersCount={activeOrdersCount}
      />

      <main className={styles.main}>
        {stockAlerts.length > 0 && (
          <div
            style={{
              background: "rgba(39,174,96,0.1)",
              border: "1px solid var(--green)",
              borderRadius: "12px",
              padding: "0.9rem 1.1rem",
              marginBottom: "1rem",
            }}
          >
            {stockAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.3rem 0",
                }}
              >
                <span>
                  {(() => {
                    const template = dict.customer.misc.stockBackBannerText;
                    const [before, after] = template.split("{name}");
                    return (
                      <>
                        {before}
                        <strong>{alert.productName || alert.productCode}</strong>
                        {after}
                      </>
                    );
                  })()}
                </span>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => dismissStockAlert(alert.id)}
                  style={{ flexShrink: 0 }}
                >
                  {dict.customer.misc.gotItButton}
                </button>
              </div>
            ))}
          </div>
        )}

        {activePanel === "chat" && (
          <CustomerChat
            chatMessages={chatMessages}
            sendMsg={() => sendMsg()}
            quickMsg={quickMsg}
            toggleMoreQuestions={toggleMoreQuestions}
            moreQuestionsOpen={moreQuestionsOpen}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onChatImageChange={() => {}}
            isTyping={isChatTyping}
          />
        )}

        {activePanel === "browse" && (
          <CustomerBrowse
            show={true}
            isGuest={isGuest}
            saleBannerVisible={products.some((p) => p.sale && p.stock > 0)}
            seasonBannerVisible={currentSeasonTab !== "all"}
            seasonEmoji={seasonMeta?.emoji || ""}
            seasonText={seasonMeta?.text || ""}
            seasonClassName={seasonMeta?.cls || ""}
            currentSeasonTab={currentSeasonTab}
            searchValue={searchValue}
            genderValue={genderValue}
            categoryValue={categoryValue}
            priceValue={priceValue}
            saleValue={saleValue}
            cartCount={cartCount}
            cart={cart}
            products={browseProducts}
            currentListMode={currentListMode}
            setSearchValue={setSearchValue}
            setGenderValue={setGenderValue}
            setCategoryValue={setCategoryValue}
            setPriceValue={setPriceValue}
            setSaleValue={setSaleValue}
            openVisualModal={openVisualModal}
            goLogin={goLogin}
            filterSaleOnly={() => setCurrentListMode("sale")}
            setSeasonTab={setCurrentSeasonTab}
            setListMode={setCurrentListMode}
            openCartOrAuth={openCartOrAuth}
            openProductModal={openProductModal}
            toggleWish={toggleWish}
            addToCart={addToCart}
            openTryOnFromProduct={openTryOnFromProduct}
            openShareModal={openShareModal}
            openNotifyModal={openNotifyModal}
            guestPrompt={guestPrompt}
          />
        )}

        <CustomerWishlist
          show={activePanel === "wishlist"}
          wishlistProducts={wishlistProducts}
          isGuest={isGuest}
          openProductModal={openProductModal}
          toggleWish={toggleWish}
          addToCart={addToCart}
          openTryOnFromProduct={openTryOnFromProduct}
          openShareModal={openShareModal}
          openNotifyModal={openNotifyModal}
          guestPrompt={guestPrompt}
        />

        <CustomerOrders
          show={activePanel === "orders"}
          orders={orders}
          returnRequests={returnRequests}
          onRequestReturn={openReturnRequestModal}
        />

        <CustomerLoyalty
          show={activePanel === "loyalty"}
          copyCoupon={copyCoupon}
          points={loyaltyPoints}
        />

        <CustomerGiftCard
          show={activePanel === "giftcard"}
          giftAmount={giftAmount}
          giftCustomAmount={giftCustomAmount}
          giftName={giftName}
          giftMessage={giftMessage}
          giftPreviewCode={giftPreviewCode}
          giftError={giftError}
          giftPreview={giftPreview}
          handleGcAmountChange={handleGcAmountChange}
          updateGiftPreview={updateGiftPreview}
          buyGiftCard={buyGiftCard}
          setGiftAmount={setGiftAmount}
          setGiftCustomAmount={setGiftCustomAmount}
          setGiftName={setGiftName}
          setGiftMessage={setGiftMessage}
          giftCheckCode={giftCheckCode}
          setGiftCheckCode={setGiftCheckCode}
          giftCheckResult={giftCheckResult}
          giftCheckError={giftCheckError}
          checkGiftCardBalance={checkGiftCardBalance}
        />

        <CustomerPolicy show={activePanel === "policy"} />
      </main>

      <ProductModal
        open={productModalOpen}
        product={selectedProduct}
        isGuest={isGuest}
        wished={wishlistCodes.includes(selectedProductCode)}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        customColor={customColor}
        customSize={customSize}
        closeProductModal={closeProductModal}
        toggleWishModal={toggleWish}
        openShareModal={openShareModal}
        setSelectedColor={setSelectedColor}
        setSelectedSize={setSelectedSize}
        setCustomColor={setCustomColor}
        setCustomSize={setCustomSize}
        guestPrompt={guestPrompt}
        addToCart={addToCart}
        openTryOnFromProduct={openTryOnFromProduct}
        openNotifyModal={openNotifyModal}
      />

      <ShareModal
        open={shareModalOpen}
        shareItemName={shareItemName}
        copied={shareCopied}
        closeShareModal={closeShareModal}
        doShare={doShare}
      />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        cartPoints={total}
        cartTotal={total}
        discountText={
          appliedDiscount ? `${Math.round(appliedDiscount * 100)}${dict.customer.misc.discountSuffix}` : ""
        }
        couponValue={couponValue}
        setCouponValue={setCouponValue}
        closeCart={closeCart}
        changeQty={changeQty}
        removeItem={removeItem}
        applyCoupon={applyCoupon}
        startCheckout={startCheckout}
        availablePoints={loyaltyPoints}
        pointsInput={pointsInput}
        setPointsInput={setPointsInput}
        applyPointsRedemption={applyPointsRedemption}
        removePointsRedemption={removePointsRedemption}
        appliedPointsRedeemed={appliedPointsRedeemed}
        pointsDiscountAmount={pointsDiscountAmount}
      />

      <PreCheckoutFeedback
        open={preCheckoutOpen}
        pcfRating={pcfRating}
        pcfText={pcfText}
        selectedTopics={pcfTopics}
        setPcfRating={setPcfRating}
        setPcfText={setPcfText}
        togglePcfTopic={togglePcfTopic}
        submitPreCheckoutFeedback={submitPreCheckoutFeedback}
        skipToCheckout={skipToCheckout}
      />

      <VisualSearchModal
        open={visualOpen}
        tryonSelfie={tryonSelfie}
        tryOnResult={tryOnResult}
        tryOnLoading={tryOnLoading}
        tryOnError={tryOnError}
        closeVisualModal={closeVisualModal}
        tryOnSelfieUpload={tryOnSelfieUpload}
        clearTryonSelfie={clearTryonSelfie}
        onTryOn={handleTryOnRequest}
      />

      <ReturnRequestModal
        open={!!returnModalItem}
        item={returnModalItem}
        onClose={closeReturnRequestModal}
        onSubmit={submitReturnRequest}
      />
    </>
  );
}