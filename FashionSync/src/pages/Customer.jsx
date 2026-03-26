import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/customer/Customer.module.scss";
import { loadOrders } from "../functions/checkout/checkoutStorage";
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
} from "../functions/customer/catalog";
import {
  loadCart,
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
  const [cart, setCart] = useState(loadCart());

  const [searchValue, setSearchValue] = useState("");
  const [genderValue, setGenderValue] = useState("");
  const [categoryValue, setCategoryValue] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [saleValue, setSaleValue] = useState("");
  const [currentSeasonTab, setCurrentSeasonTab] = useState("all");
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

  useEffect(() => {
    if (!currentUser?.email) {
      setOrders([]);
      return;
    }

    const userOrders = loadOrders(currentUser.email);
    setOrders(Array.isArray(userOrders) ? userOrders.slice().reverse() : []);
  }, [currentUser, activePanel]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    openDB();

    const auth = initAuth();

    if (!auth.mode) {
      navigate("/");
      return;
    }

    setCurrentUser(auth.currentUser || null);
    setIsGuest(Boolean(auth.isGuest));
    setProducts(loadProducts());
  }, [navigate]);

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
  ]);

  const wishlistProducts = useMemo(() => {
    return products
      .filter((product) => wishlistCodes.includes(product.code))
      .map((product) => ({ ...product, wished: true }));
  }, [products, wishlistCodes]);

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

    setWishlistCodes((prev) =>
      prev.includes(code)
        ? prev.filter((item) => item !== code)
        : [...prev, code]
    );
  }

  function openProductModal(code) {
    const product = products.find((item) => item.code === code);
    if (!product) return;

    setSelectedProductCode(code);
    setSelectedColor(product.colors?.[0] || "");
    setSelectedSize(product.sizes?.[0] || "");
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

  function addToCart(code, fromModal = false) {
    if (isGuest) {
      guestPrompt();
      return;
    }

    const product = products.find((item) => item.code === code);
    if (!product || product.stock <= 0) return;

    const variant = fromModal ? getChosenVariant() : { size: "", color: "" };

    setCart((prevCart) => {
      const nextCart = addToCartFn({ cart: prevCart, product, variant });
      return nextCart;
    });

    if (fromModal) closeProductModal();
  }

  function changeQty(key, delta) {
    const nextCart = changeQtyFn(cart, key, delta, products);
    setCart(nextCart);
  }

  function removeItem(key) {
    const nextCart = removeItemFn(cart, key);
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
    const discount = COUPONS[code];

    if (!discount) {
      alert("קוד קופון לא תקין.");
      return;
    }

    setAppliedDiscount(discount);
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
        : [...prev, topic]
    );
  }

  function submitPreCheckoutFeedback() {
    const existing = JSON.parse(localStorage.getItem(LS_KEYS.FEEDBACK) || "[]");

    existing.push({
      date: new Date().toISOString(),
      type: "pre-checkout",
      user: currentUser?.email || "אורח",
      rating: pcfRating,
      topics: pcfTopics,
      text: pcfText.trim(),
    });

    localStorage.setItem(LS_KEYS.FEEDBACK, JSON.stringify(existing));
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
        "_blank"
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

  function buyGiftCard() {
    const result = buyGiftCardFn({
      amount: giftAmount,
      customAmount: giftCustomAmount,
      name: giftName,
    });

    if (!result.ok) {
      setGiftError(result.error);
      return;
    }

    setGiftError("");
    setGiftPreviewCode(result.code);
    navigate("/checkout");
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
      />

      <main className={styles.main}>
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
          appliedDiscount
            ? `${Math.round(appliedDiscount * 100)}% הנחה`
            : ""
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