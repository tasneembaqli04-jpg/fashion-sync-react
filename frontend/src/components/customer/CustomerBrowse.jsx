import { useEffect, useRef, useState } from "react";
import commonStyles from "../../styles/customer/Customer.module.scss";
import browseStyles from "../../styles/customer/CustomerBrowse.module.scss";
import ProductCard from "./ProductCard";
import { CATEGORIES } from "../../data/categories";

export default function CustomerBrowse({
  show = false,
  isGuest,
  seasonBannerVisible,
  seasonEmoji,
  seasonText,
  seasonClassName,
  currentSeasonTab,
  searchValue,
  genderValue,
  categoryValue,
  priceValue,
  saleValue,
  cartCount,
  cart,
  products,
  currentListMode,
  setSearchValue,
  setGenderValue,
  setCategoryValue,
  setPriceValue,
  setSaleValue,
  onImageSearchUpload,
  goLogin,
  setSeasonTab,
  setListMode,
  openCartOrAuth,
  openProductModal,
  toggleWish,
  addToCart,
  openTryOnFromProduct,
  openShareModal,
  openNotifyModal,
  guestPrompt,
}) {
  const productsStartRef = useRef(null);
  const [showCatalogBanners, setShowCatalogBanners] = useState(true);
  useEffect(() => {
    if (!show || !productsStartRef.current) return;

    const marker = productsStartRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const markerIsBelowTop = entry.boundingClientRect.top > 120;
        setShowCatalogBanners(markerIsBelowTop);
      },
      {
        threshold: 0,
      }
    );

    observer.observe(marker);

    return () => {
      observer.disconnect();
    };
  }, [show]);
  if (!show) return null;

  const seasonBannerClass =
    seasonClassName === "summer"
      ? browseStyles.summer
      : seasonClassName === "winter"
        ? browseStyles.winter
        : seasonClassName === "spring"
          ? browseStyles.spring
          : seasonClassName === "autumn"
            ? browseStyles.autumn
            : "";

  return (
    <div>
      <div className={browseStyles.filterBar}>
        <div className={browseStyles.filterLeft}>
          <div className={browseStyles.searchWrap}>
            <input
              type="text"
              className={browseStyles.searchInput}
              placeholder="שם, קוד, חיפוש לפי תמונה..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <label
              className={browseStyles.searchCameraBtn}
              title="חיפוש לפי תמונה"
            >
              📷
              <input
                type="file"
                accept="image/*"
                onChange={onImageSearchUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>

        <div className={browseStyles.filterRight}>
          <select
            value={genderValue}
            onChange={(e) => setGenderValue(e.target.value)}
          >
            <option value="">לכולם</option>
            <option value="נשים">נשים</option>
            <option value="גברים">גברים</option>
          </select>

          <select
            value={categoryValue}
            onChange={(e) => setCategoryValue(e.target.value)}
          >
            <option value="">כל הקטגוריות</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={currentSeasonTab}
            onChange={(e) => setSeasonTab(e.target.value)}
          >
            <option value="all">כל העונות</option>
            <option value="summer">☀️ קיץ</option>
            <option value="winter">❄️ חורף</option>
            <option value="spring-autumn">🌸 אביב / סתיו</option>
          </select>

          <select
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
          >
            <option value="">כל המחירים</option>
            <option value="0-150">עד ₪150</option>
            <option value="150-300">₪150–₪300</option>
            <option value="300-500">₪300–₪500</option>
            <option value="500-9999">מעל ₪500</option>
          </select>

    

          <button
            className={commonStyles.btn}
            style={{ flex: "0 0 auto", minWidth: "130px" }}
            onClick={openCartOrAuth}
          >
            🛒 סל ({cartCount})
          </button>
        </div>
      </div>

      <div className={browseStyles.tabsSticky}>
        <div className={browseStyles.pageHeader}>
          <div className={commonStyles.pageTitle}>🏬 קטלוג מוצרים</div>
        
          {showCatalogBanners && seasonBannerVisible && (
            <div className={`${browseStyles.seasonBanner} ${seasonBannerClass}`}>
              <span className={browseStyles.seasonEmoji}>{seasonEmoji}</span>
              <span className={browseStyles.seasonText}>{seasonText}</span>
            </div>
          )}

          {isGuest && (
            <div className={browseStyles.guestCatalogBanner}>
              <div className={browseStyles.gbt}>
                👀 אתה גולש כ<strong>אורח</strong>. <strong>התחבר</strong> כדי
                להוסיף לסל ולהזמין.
              </div>
              <button
                className={`${commonStyles.btn} ${commonStyles.btnGold}`}
                style={{ padding: "0.5rem 1rem", fontSize: "0.86rem" }}
                onClick={goLogin}
              >
                🔑 התחבר
              </button>
            </div>
          )}

        
        </div>
        <div className={commonStyles.tabs}>
          <button
            className={`${commonStyles.tabBtn} ${
              currentListMode === "all" ? commonStyles.activeTab : ""
            }`}
            onClick={() => setListMode("all")}
          >
            הכל
          </button>
          <button
            className={`${commonStyles.tabBtn} ${
              currentListMode === "trending" ? commonStyles.activeTab : ""
            }`}
            onClick={() => setListMode("trending")}
          >
            🔥 טרנדים
          </button>
          <button
            className={`${commonStyles.tabBtn} ${
              currentListMode === "bestsellers" ? commonStyles.activeTab : ""
            }`}
            onClick={() => setListMode("bestsellers")}
          >
            ⭐ נמכרים ביותר
          </button>
          <button
            className={`${commonStyles.tabBtn} ${
              currentListMode === "sale" ? commonStyles.activeTab : ""
            }`}
            onClick={() => setListMode("sale")}
          >
            🏷️ מבצעים
          </button>
        </div>
      </div>
      <div ref={productsStartRef} style={{ height: "1px" }} />

      {products?.length ? (
        <div className={browseStyles.productsGrid}>
          {products.map((product) => (
            <ProductCard
              key={product.code}
              product={product}
              cart={cart}
              isGuest={isGuest}
              openProductModal={openProductModal}
              toggleWish={toggleWish}
              addToCart={addToCart}
              openTryOnFromProduct={openTryOnFromProduct}
              openShareModal={openShareModal}
              openNotifyModal={openNotifyModal}
              guestPrompt={guestPrompt}
            />
          ))}
        </div>
      ) : (
        <div className={commonStyles.card} style={{ textAlign: "center" }}>
          לא נמצאו פריטים לעונה או לסינון שבחרת.
        </div>
      )}
    </div>
  );
}