import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/customer/Customer.module.scss";
import { getOrdersByUser } from "../backend/services/orders/ordersService";
import { getFeaturedProduct } from "../functions/settings/featuredProductService";
import { getWishlist, saveWishlist } from "../functions/wishlist/wishlistService";
import { addFeedback } from "../functions/feedback/feedbackService";
import { getLoyaltyPoints } from "../functions/customer/customerFirestore";
import { requestStockNotification, getMyStockAlerts, markStockAlertSeen } from "../functions/notifications/notificationsService";
import { LS_KEYS } from "../data/constants";
import { COUPONS } from "../data/coupons";

import {
  applyTheme,
  getSavedTheme,
  toggleTheme as toggleThemeFn,
} from "../functions/customer/theme";
import {
  initAuth,
  doLogout as doLogoutFn,
  goHome,
  goLogin,
  guestPrompt,
} from "../functions/customer/auth";
import { openDB } from "../functions/customer/storage";
import {
  loadProducts,
  filterProducts,
  SEASON_META,
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
import {
  buildGiftCardPreview,
  buyGiftCard as buyGiftCardFn,
} from "../functions/customer/giftCard";
import { getGiftCard } from "../functions/giftcard/giftCardService";
import CustomerTopbar from "../components/customer/CustomerTopbar";
import CustomerSidebar from "../components/customer/CustomerSidebar";
import CustomerChat from "../components/customer/CustomerChat";
import CustomerBrowse from "../components/customer/CustomerBrowse";
import CustomerWishlist from "../components/customer/CustomerWishlist";
import CustomerOrders from "../components/customer/CustomerOrders";
import CustomerLoyalty from "../components/customer/CustomerLoyalty";
import CustomerGiftCard from "../components/customer/CustomerGiftCard";
import CustomerPolicy from "../components/customer/CustomerPolicy";
import ProductModal from "../components/customer/ProductModal";
import ShareModal from "../components/customer/ShareModal";
import NotifyModal from "../components/customer/NotifyModal";
import CartDrawer from "../components/customer/CartDrawer";
import PreCheckoutFeedback from "../components/customer/PreCheckoutFeedback";
import VisualSearchModal from "../components/customer/VisualSearchModal";

export default function Customer() {
  const navigate = useNavigate();

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

  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyText, setNotifyText] = useState("");
  const [notifyProduct, setNotifyProduct] = useState(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [couponValue, setCouponValue] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const [preCheckoutOpen, setPreCheckoutOpen] = useState(false);
  const [pcfRating, setPcfRating] = useState(0);
  const [pcfText, setPcfText] = useState("");
  const [pcfTopics, setPcfTopics] = useState([]);

  const [visualOpen, setVisualOpen] = useState(false);
  const [tryonSelfie, setTryonSelfie] = useState("");

  const [giftAmount, setGiftAmount] = useState("100");
  const [giftCustomAmount, setGiftCustomAmount] = useState("");
  const [giftName, setGiftName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftPreviewCode, setGiftPreviewCode] = useState("—");
  const [giftError, setGiftError] = useState("");
  const [giftCheckCode, setGiftCheckCode] = useState("");
  const [giftCheckResult, setGiftCheckResult] = useState(null);
  const [giftCheckError, setGiftCheckError] = useState("");

  useEffect(() => {
    if (!currentUser?.email) {
      setOrders([]);
      setLoyaltyPoints(0);
      setRawStockAlerts([]);
      return;
    }

    let cancelled = false;

    getOrdersByUser(currentUser.email).then((userOrders) => {
      if (!cancelled) {
        setOrders(userOrders.slice().reverse());
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
  const { total } = getCartTotals(cart, appliedDiscount);

  const seasonMeta =
    currentSeasonTab !== "all" ? SEASON_META[currentSeasonTab] : null;

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

  function sendMsg(forcedText) {
    const text = (forcedText ?? chatInput).trim();
    if (!text) return;

    setChatMessages((prev) => [...prev, { type: "user", html: text }]);

    const reply = getReply(text, products);

    setTimeout(() => {
      setChatMessages((prev) => [...prev, { type: "bot", html: reply }]);
    }, 500);

    setChatInput("");
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
    };
  }

  async function addToCart(code, fromModal = false) {
    if (isGuest) {
      guestPrompt();
      return;
    }

    const product = products.find((item) => item.code === code);
    if (!product || product.stock <= 0) return;

    if (fromModal && !selectedSize) return;

    const variant = fromModal ? getChosenVariant() : { size: "", color: "" };

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

  function applyCoupon() {
    const code = couponValue.trim().toUpperCase();
    const coupon = COUPONS.find((c) => c.code === code && c.active);

    if (!coupon) {
      alert("קוד קופון לא תקין.");
      return;
    }

    setAppliedDiscount(coupon.discount);
    localStorage.setItem(LS_KEYS.DISCOUNT, String(coupon.discount));
  }

  function startCheckout() {
    if (!cart.length) {
      alert("הסל ריק");
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
      user: currentUser?.email || "אורח",
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
    const text = `בדקו את ${product.name} ב-FashionSync – ₪${product.price}`;

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
        encodeURIComponent("ראה את " + product.name) +
        "&body=" +
        encodeURIComponent(text + "\n" + url);
    }
  }

  function openNotifyModal(code) {
    const product = products.find((item) => item.code === code);
    if (!product) return;

    setNotifyText(`נעדכן אותך כש<strong>${product.name}</strong> יחזור למלאי.`);
    setNotifyProduct(product);
    setNotifyModalOpen(true);
  }

  function closeNotifyModal() {
    setNotifyModalOpen(false);
  }

  function submitNotify(email, phone) {
    if (!email && !phone) {
      alert("יש למלא כתובת Gmail או מספר טלפון");
      return;
    }

    if (email && !email.toLowerCase().endsWith("@gmail.com")) {
      alert("יש להזין כתובת Gmail תקינה");
      return;
    }

    requestStockNotification({
      productCode: notifyProduct?.code,
      productName: notifyProduct?.name,
      email,
      phone,
    });

    alert("נשלח! נודיע לך כשהמוצר יחזור למלאי.");
    setNotifyModalOpen(false);
  }

  function openVisualModal() {
    setVisualOpen(true);
  }

  function closeVisualModal() {
    setVisualOpen(false);
    setTryonSelfie("");
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

  function openTryOnFromProduct() {
    setVisualOpen(true);
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
      setGiftCheckError("נא להזין קוד כרטיס מתנה");
      return;
    }

    const card = await getGiftCard(code);

    if (!card) {
      setGiftCheckError("קוד כרטיס מתנה לא נמצא");
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
    doLogoutFn(setCart);
  }

  function copyCoupon(code, buttonEl) {
    navigator.clipboard?.writeText(code);

    if (!buttonEl) return;

    const original = buttonEl.textContent;
    buttonEl.textContent = "✓ הועתק";
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
                  🎉 <strong>{alert.productName || alert.productCode}</strong> חזר
                  למלאי!
                </span>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => dismissStockAlert(alert.id)}
                  style={{ flexShrink: 0 }}
                >
                  ✕ הבנתי
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

        <CustomerOrders show={activePanel === "orders"} orders={orders} />

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

      <NotifyModal
        open={notifyModalOpen}
        notifyText={notifyText}
        closeNotifyModal={closeNotifyModal}
        submitNotify={submitNotify}
      />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        cartPoints={total}
        cartTotal={total}
        discountText={
          appliedDiscount ? `${Math.round(appliedDiscount * 100)}% הנחה` : ""
        }
        couponValue={couponValue}
        setCouponValue={setCouponValue}
        closeCart={closeCart}
        changeQty={changeQty}
        removeItem={removeItem}
        applyCoupon={applyCoupon}
        startCheckout={startCheckout}
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
        closeVisualModal={closeVisualModal}
        tryOnSelfieUpload={tryOnSelfieUpload}
        clearTryonSelfie={clearTryonSelfie}
      />
    </>
  );
}