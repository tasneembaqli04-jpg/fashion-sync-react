import { useEffect, useMemo, useRef, useState } from "react";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { POINT_REDEMPTION_VALUE } from "../data/storePolicy";
import { useShareModal } from "../hooks/useShareModal";
import { useGiftCard } from "../hooks/useGiftCard";
import { useTryOn } from "../hooks/useTryOn";
import { useCustomerOrders } from "../hooks/useCustomerOrders";
import { useChat } from "../hooks/useChat";
import { getItemName } from "../functions/customer/itemDisplay";
import { useNavigate } from "react-router-dom";
import styles from "../styles/customer/Customer.module.scss";
import { getFeaturedProduct } from "../services/settings/featuredProductService";
import {
  getWishlist,
  saveWishlist,
} from "../services/wishlist/wishlistService";
import { addFeedback } from "../services/feedback/feedbackService";
import { getLoyaltyPoints } from "../services/customer/customerFirestore";
import {
  requestStockNotification,
  hasPendingStockNotification,
  getMyStockAlerts,
  markStockAlertSeen,
} from "../services/notifications/notificationsService";
import { LS_KEYS } from "../functions/checkout/checkoutStorage";
import { useDialog } from "../components/common/DialogProvider";
import { useLanguage } from "../translations/LanguageProvider";
import { getCoupon } from "../services/coupons/couponsService";
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
  isGuestMode,
  syncAuthCache,
  clearAuthCache,
} from "../functions/customer/auth";
import { auth as firebaseAuth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { openDB } from "../functions/customer/storage";
import { isVariantAvailable } from "../functions/customer/stockPolicy";
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
import CustomerTopbar from "../components/customer/CustomerTopbar";
import CustomerSidebar from "../components/customer/CustomerSidebar";
import CustomerChat from "../components/customer/CustomerChat";
import CustomerBrowse from "../components/customer/CustomerBrowse";
import CustomerWishlist from "../components/customer/CustomerWishlist";
import CustomerOrders from "../components/customer/CustomerOrders";
import ReturnRequestModal from "../components/customer/ReturnRequestModal";
import CustomerLoyalty from "../components/customer/CustomerLoyalty";
import CustomerGiftCard from "../components/customer/CustomerGiftCard";
import CustomerPolicy from "../components/customer/CustomerPolicy";
import ProductModal from "../components/customer/ProductModal";
import ShareModal from "../components/customer/ShareModal";
import CartDrawer from "../components/customer/CartDrawer";
import PreCheckoutFeedback from "../components/customer/PreCheckoutFeedback";
import TryOnModal from "../components/customer/TryOnModal";

/**
 * Marks the history entry the feedback dialog pushes for itself.
 *
 * Held in the history state rather than inferred, so the code can tell an
 * entry it created from one the router or an earlier panel created, and never
 * call back() on somebody else's.
 */
const PRE_CHECKOUT_DIALOG = "preCheckout";

export default function Customer() {
  const navigate = useNavigate();
  const { confirmDialog, alertDialog } = useDialog();
  const { t: dict, lang } = useLanguage();

  const [theme, setTheme] = useState(getSavedTheme());
  const [activePanel, setActivePanel] = useState("browse");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const existingPanel = window.history.state?.panel;

    if (existingPanel) {
      setActivePanel(existingPanel);
    } else {
      window.history.replaceState({ panel: "browse" }, "");
    }

    function handlePopState(event) {
      const panel = event.state?.panel || "browse";
      setActivePanel(panel);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigateToPanel(panelName) {
    if (panelName === activePanel) return;
    window.history.pushState({ panel: panelName }, "");
    setActivePanel(panelName);
  }

  const mainContentRef = useRef(null);

  // Product codes with a stock-alert request being written right now, so a
  // second press cannot slip between the check and the write.
  const notifyInFlightRef = useRef(new Set());

  function goBackPanel() {
    navigateToPanel("browse");
    mainContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const [currentUser, setCurrentUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  const [products, setProducts] = useState([]);

  // The store address and opening hours were fetched here to feed the offline
  // fallback replies. That fallback no longer answers questions, so the two
  // reads went with it. The chat service reads both from Firestore itself when
  // it is reachable, which is the only place they were ever accurate.

  const [featuredCode, setFeaturedCode] = useState("");
  const [cart, setCart] = useState(loadCart());

  const [searchValue, setSearchValue] = useState("");
  const [genderValue, setGenderValue] = useState("");
  const [categoryValue, setCategoryValue] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [saleValue, setSaleValue] = useState("");
  const [currentSeasonTab, setCurrentSeasonTab] = useState(getCurrentSeason());
  const [currentListMode, setCurrentListMode] = useState("all");

  // The shopping assistant, self-contained: it needs nothing from the page
  // beyond the language, which it reads itself.
  const {
    chatMessages,
    chatInput,
    setChatInput,
    isChatTyping,
    moreQuestionsOpen,
    sendMsg,
    quickMsg,
    toggleMoreQuestions,
  } = useChat();

  const [wishlistCodes, setWishlistCodes] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [rawStockAlerts, setRawStockAlerts] = useState([]);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProductCode, setSelectedProductCode] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [customSize, setCustomSize] = useState("");

  // Declared here, where the share state used to sit, and after `products`,
  // which it reads to resolve the code it is opened with.
  const {
    shareModalOpen,
    shareItemName,
    shareCopied,
    openShareModal,
    closeShareModal,
    doShare,
  } = useShareModal(products);

  const [cartOpen, setCartOpen] = useState(false);
  const [couponValue, setCouponValue] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [pointsInput, setPointsInput] = useState("");
  const [appliedPointsRedeemed, setAppliedPointsRedeemed] = useState(0);

  const [preCheckoutOpen, setPreCheckoutOpen] = useState(false);
  const [pcfRating, setPcfRating] = useState(0);
  const [pcfText, setPcfText] = useState("");

  // Going back closes the dialog and returns to the cart, which is what the ✕
  // does. The entry pushed when the dialog opened is what the browser consumes
  // here, so the customer stays on the page instead of leaving the shop.
  //
  // Kept as its own effect, next to the state it owns, rather than folded into
  // the history effect above: that one is about which panel is showing, and
  // reaching forward to a setter declared eighty lines below it would be
  // harder to follow than an extra listener.
  useEffect(() => {
    if (!preCheckoutOpen) return;

    function closeOnBack() {
      setPreCheckoutOpen(false);
      setCartOpen(true);
    }

    window.addEventListener("popstate", closeOnBack);
    return () => window.removeEventListener("popstate", closeOnBack);
  }, [preCheckoutOpen]);

  // Declared after `products` and the product dialog's own state, since it
  // resolves the product to try on from the code that dialog is showing.
  const {
    tryOnOpen,
    tryOnSelfie,
    tryOnLoading,
    tryOnResult,
    tryOnError,
    closeTryOnModal,
    tryOnSelfieUpload,
    clearTryOnSelfie,
    handleTryOnRequest,
    openTryOnFromProduct,
  } = useTryOn({ products, selectedProductCode, setSelectedProductCode });

  // Placed after cart, currentUser and navigate, all of which it receives.
  const {
    giftAmount,
    setGiftAmount,
    giftCustomAmount,
    setGiftCustomAmount,
    giftName,
    setGiftName,
    giftMessage,
    setGiftMessage,
    giftPreviewCode,
    giftError,
    giftPreview,
    handleGcAmountChange,
    buyGiftCard,
    giftCheckCode,
    setGiftCheckCode,
    giftCheckResult,
    giftCheckError,
    checkGiftCardBalance,
  } = useGiftCard({ cart, setCart, currentUser, navigate });

  // Orders and the returns raised against them, with their own loading. Placed
  // after currentUser and activePanel, both of which it reads.
  const {
    orders,
    returnRequests,
    returnModalOrder,
    unseenReturnUpdates,
    activeOrdersCount,
    updateOrder,
    handleCancelOrder,
    dismissReturnUpdate,
    openReturnRequestModal,
    closeReturnRequestModal,
    submitReturnRequest,
  } = useCustomerOrders({ currentUser, activePanel });

  useEffect(() => {
    if (!currentUser?.email) {
      setLoyaltyPoints(0);
      setRawStockAlerts([]);
      return;
    }

    let cancelled = false;

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

  // Firebase Auth is the source of truth for identity. initAuth() below only
  // reads a localStorage cache so the page can render straight away; this
  // listener confirms or overrides it once Firebase restores the session.
  //
  // Without it the two can drift apart: a cleared Firebase session leaves the
  // cache in place, the interface shows a signed-in customer, and every
  // Firestore call fails with permission-denied and no visible error.
  //
  // Guests are skipped on purpose — guest mode has no Firebase session by
  // design, so an absent user is expected rather than stale.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (isGuestMode()) {
        return;
      }

      if (!firebaseUser) {
        clearAuthCache();
        setCurrentUser(null);
        setIsGuest(false);
        navigate("/");
        return;
      }

      setCurrentUser(syncAuthCache(firebaseUser));
      setIsGuest(false);
    });

    return () => unsubscribe();
  }, [navigate]);

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
        "item",
      );
      if (sharedItemCode) {
        const sharedProduct = products.find((p) => p.code === sharedItemCode);
        if (sharedProduct) {
          // Passed through, because the catalogue above is a local list and
          // the state behind it has not been committed yet.
          openProductModal(sharedItemCode, sharedProduct);
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

  // The alert stores the product name in Hebrew, since that is the language it
  // was requested in. The catalogue is joined back on so the banner can show
  // the name in whichever language the customer is reading now.
  const stockAlerts = useMemo(() => {
    return rawStockAlerts.flatMap((alert) => {
      const product = products.find((p) => p.code === alert.productCode);
      if (!product || Number(product.stock) <= 0) return [];

      return [{ ...alert, product }];
    });
  }, [rawStockAlerts, products]);
  const cartCount = getCartCount(cart);
  const pointsDiscountAmount = appliedPointsRedeemed * POINT_REDEMPTION_VALUE;
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
    // dict belongs here: the banner text is read from it, so leaving it out
    // froze the wording at whichever language was active on the first render
    // and switching language left the old sentence on screen.
  }, [currentSeasonTab, realCurrentSeason, dict]);


  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function showPanel(panelName) {
    navigateToPanel(panelName);
    closeSidebar();
  }

  function navProtected(panelName) {
    if (!isGuest) {
      navigateToPanel(panelName);
      closeSidebar();
      return;
    }
    guestPrompt();
  }

  function handleToggleTheme() {
    toggleThemeFn(setTheme);
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

  /**
   * Opens the product dialog on a code.
   *
   * `knownProduct` exists for the one caller that already holds the product
   * and cannot rely on state: the page load that follows a shared link runs
   * before the catalogue it just fetched has been committed, so looking the
   * code up here would find nothing and the dialog would stay shut.
   */
  function openProductModal(code, knownProduct) {
    const product = knownProduct || products.find((item) => item.code === code);
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
    const hasVariants =
      Array.isArray(product.variants) && product.variants.length > 0;

    if (fromModal && hasVariants && selectedSize !== "אחר") {
      if (!isVariantAvailable(product, variant)) {
        alertDialog(dict.customer.dialogs.outOfStockSelection);
        return;
      }
    } else if (!hasVariants && product.stock <= 0) {
      return;
    }

    const nextCart = await addToCartFn({
      email: currentUser.email.trim().toLowerCase(),
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
      alertDialog(dict.customer.dialogs.couponSeasonOnly);
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
      alertDialog(
        dict.customer.dialogs.insufficientPoints.replace(
          "{points}",
          loyaltyPoints.toLocaleString(),
        ),
      );
      return;
    }

    const { raw, discount } = getCartTotals(cart, appliedDiscount);
    const afterCoupon = Math.max(0, raw - discount);
    const maxPointsUsable = Math.floor(afterCoupon / POINT_REDEMPTION_VALUE);

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

    // Cleared each time, so a rating left from an earlier visit to checkout
    // is not shown as though it had just been given.
    setCartOpen(false);
    setPcfRating(0);
    setPcfText("");
    setPreCheckoutOpen(true);

    // An entry of its own, so that going back has something belonging to the
    // dialog to consume. Without it the browser pops the entry underneath —
    // the page the customer arrived from — and she leaves the shop entirely
    // while the dialog merely closes on the way out.
    //
    // The panel is carried across unchanged, so popping this entry lands on
    // the same panel and only the dialog goes away.
    window.history.pushState(
      { panel: activePanel, dialog: PRE_CHECKOUT_DIALOG },
      "",
    );
  }

  /**
   * Leaves the feedback step for checkout, sending what was given.
   *
   * One button does both, because two buttons leading to the same screen ask
   * the customer to make a distinction at the moment she wants to pay. What
   * she filled in decides: anything at all is sent, and an untouched form is
   * simply not saved, so the feedback list is never padded with empty rows
   * that would drag the average rating down towards zero.
   */
  /**
   * Leaves the feedback step for the cart, keeping nothing.
   *
   * The ✕ and Escape mean the purchase is being reconsidered, not that the
   * rating is being submitted, so what was typed is dropped rather than sent.
   * A dismissal that quietly saved would be a side effect nobody asked for,
   * and the customer is going back to a screen she will likely return from —
   * saving here would collect a second entry for the same visit.
   */
  function closeFeedbackToCart() {
    // Going back through the entry the dialog pushed, rather than just hiding
    // the dialog, so that closing by ✕ and closing by the browser's back
    // button leave the same history behind. Hiding it without popping would
    // strand the entry, and the next back press would appear to do nothing.
    //
    // The listener above does the closing, so this only unwinds the history.
    // If the entry is not there — nothing pushed it, or it has already been
    // consumed — the dialog is closed directly rather than calling back() and
    // navigating off the page.
    if (window.history.state?.dialog === PRE_CHECKOUT_DIALOG) {
      window.history.back();
      return;
    }

    setPreCheckoutOpen(false);
    setCartOpen(true);
  }

  function continueToCheckout() {
    const comment = pcfText.trim();
    const hasFeedback = pcfRating > 0 || comment !== "";

    if (hasFeedback) {
      addFeedback({
        type: "pre-checkout",
        user: currentUser?.email || dict.customer.misc.guestFallbackName,
        rating: pcfRating,
        text: comment,
      });
    }

    setPreCheckoutOpen(false);

    // Checkout takes the place of the entry the dialog pushed, rather than
    // stacking on top of it. Otherwise coming back from checkout stops on a
    // spare entry showing the same panel, and the customer has to press back
    // twice through screens that look identical.
    const onDialogEntry =
      window.history.state?.dialog === PRE_CHECKOUT_DIALOG;

    navigate("/checkout", { replace: onDialogEntry });
  }

  async function openNotifyModal(code) {
    if (isGuest) {
      guestPrompt();
      return;
    }

    const product = products.find((item) => item.code === code);
    if (!product) return;

    // Held while the write is in flight. The check and the write are two
    // round trips, so without this a second press during the gap would pass
    // its own check before the first had written anything, and both would
    // create a request. A ref rather than state, because it has to be true
    // immediately: a state update would not be visible until the next render,
    // which is later than the second press.
    if (notifyInFlightRef.current.has(product.code)) return;
    notifyInFlightRef.current.add(product.code);

    try {
      // Asked before anything else, so a customer who is already signed up is
      // told so straight away rather than being made to confirm a request that
      // was never going to be created.
      //
      // A check that cannot be made is treated as "not signed up" and the
      // registration goes ahead: a possible duplicate is a smaller harm than
      // refusing to register someone because the network faltered, and the
      // service checks again before it writes.
      let alreadySignedUp = false;

      try {
        alreadySignedUp = await hasPendingStockNotification(
          currentUser?.email || "",
          product.code,
        );
      } catch (err) {
        console.warn(`Stock alert check skipped: ${err.message}`);
      }

      if (alreadySignedUp) {
        alertDialog(dict.customer.dialogs.notifyAlreadyRegistered);
        return;
      }

      const confirmed = await confirmDialog(
        dict.customer.dialogs.notifyConfirmMessage
          .replace("{email}", currentUser?.email || "")
          // The dialog is written in the interface language, so the product
          // name has to follow it.
          .replace("{name}", getItemName(product, lang)),
      );
      if (!confirmed) return;

      const { created } = await requestStockNotification({
        productCode: product.code,
        productName: product.name,
        email: currentUser?.email || "",
      });

      // Reached when someone signed up from another tab or device between the
      // check above and the write. Rare, and it costs a confirmation rather
      // than a duplicate request.
      if (!created) {
        alertDialog(dict.customer.dialogs.notifyAlreadyRegistered);
        return;
      }

      alertDialog(
        dict.customer.dialogs.notifySuccessMessage.replace(
          "{email}",
          currentUser?.email || "",
        ),
      );
    } finally {
      notifyInFlightRef.current.delete(product.code);
    }
  }

  async function dismissStockAlert(id) {
    await markStockAlertSeen(id);
    setRawStockAlerts((prev) => prev.filter((item) => item.id !== id));
  }
  function handleLogout() {
    doLogoutFn(setCart, dict.customer.dialogs);
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
        showBackButton={activePanel !== "browse"}
        onGoBack={goBackPanel}
        showChatButton={activePanel !== "chat"}
        onOpenChat={() => showPanel("chat")}
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          if (activePanel !== "browse") {
            navigateToPanel("browse");
          }
        }}
      />

      <CustomerSidebar
        activePanel={activePanel}
        isGuest={isGuest}
        currentUser={currentUser}
        sidebarOpen={sidebarOpen}
        theme={theme}
        toggleTheme={handleToggleTheme}
        goHome={goHome}
        goLogin={goLogin}
        doLogout={handleLogout}
        showPanel={showPanel}
        navProtected={navProtected}
        closeSidebar={closeSidebar}
        stockAlertsCount={stockAlerts.length}
        activeOrdersCount={activeOrdersCount + unseenReturnUpdates.length}
      />

      <main className={styles.main} ref={mainContentRef}>
        {/*
          Keyed on the panel: a panel that fails to render shows its message
          here while the sidebar, topbar and cart stay usable, and switching
          panel clears it.
        */}
        <ErrorBoundary
          resetKey={activePanel}
          title={dict.common.errorBoundaryTitle}
          message={dict.common.errorBoundaryMessage}
        >
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
                        <strong>
                          {getItemName(alert.product, lang) ||
                            alert.productName ||
                            alert.productCode}
                        </strong>
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

        {unseenReturnUpdates.length > 0 && (
          <div
            style={{
              background: unseenReturnUpdates.some(
                (r) => r.status === "approved",
              )
                ? "rgba(39,174,96,0.1)"
                : "rgba(192,57,43,0.1)",
              border: `1px solid ${
                unseenReturnUpdates.some((r) => r.status === "approved")
                  ? "var(--green)"
                  : "var(--red)"
              }`,
              borderRadius: "12px",
              padding: "0.9rem 1.1rem",
              marginBottom: "1rem",
            }}
          >
            {unseenReturnUpdates.map((request) => {
              const template =
                request.status === "approved"
                  ? dict.customer.returns.updateBannerApproved
                  : dict.customer.returns.updateBannerRejected;
              const [before, after] = template.split("{name}");

              return (
                <div
                  key={request.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.3rem 0",
                  }}
                >
                  <span>
                    {before}
                    <strong>
                      {getItemName(
                        { name: request.itemName, nameEn: request.itemNameEn },
                        lang,
                      )}
                    </strong>
                    {after}
                  </span>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={() => dismissReturnUpdate(request.id)}
                    style={{ flexShrink: 0 }}
                  >
                    {dict.customer.misc.gotItButton}
                  </button>
                </div>
              );
            })}
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
            addToCart={addToCart}
            openProductModal={openProductModal}
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
          onCancelOrder={handleCancelOrder}
          onUpdateOrder={updateOrder}
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

        <CustomerPolicy
          show={activePanel === "policy"}
          currentUser={currentUser}
        />
        </ErrorBoundary>
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
          appliedDiscount
            ? `${Math.round(appliedDiscount * 100)}${dict.customer.misc.discountSuffix}`
            : ""
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
        setPcfRating={setPcfRating}
        setPcfText={setPcfText}
        continueToCheckout={continueToCheckout}
        closeToCart={closeFeedbackToCart}
      />

      <TryOnModal
        open={tryOnOpen}
        tryOnSelfie={tryOnSelfie}
        tryOnResult={tryOnResult}
        tryOnLoading={tryOnLoading}
        tryOnError={tryOnError}
        closeTryOnModal={closeTryOnModal}
        tryOnSelfieUpload={tryOnSelfieUpload}
        clearTryOnSelfie={clearTryOnSelfie}
        onTryOn={handleTryOnRequest}
      />

      <ReturnRequestModal
        open={!!returnModalOrder}
        order={returnModalOrder}
        returnRequests={returnRequests}
        onClose={closeReturnRequestModal}
        onSubmit={submitReturnRequest}
      />
    </>
  );
}
