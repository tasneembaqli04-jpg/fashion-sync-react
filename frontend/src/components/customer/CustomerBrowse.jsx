import { useEffect, useRef, useState } from "react";
import commonStyles from "../../styles/customer/Customer.module.scss";
import browseStyles from "../../styles/customer/CustomerBrowse.module.scss";
import ProductCard from "./ProductCard";
import { CATEGORIES } from "../../data/categories";
import { useLanguage } from "../../translations/LanguageProvider";

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
  const { t: dict } = useLanguage();
  const t = dict.customer.browse;
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
            <span className={browseStyles.searchIcon}>🔍</span>
            <input
              type="text"
              className={browseStyles.searchInput}
              placeholder={t.searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        <div className={browseStyles.filterRight}>
          <select
            value={genderValue}
            onChange={(e) => setGenderValue(e.target.value)}
          >
            <option value="">{t.genderAll}</option>
            <option value="נשים">{dict.genderLabels["נשים"]}</option>
            <option value="גברים">{dict.genderLabels["גברים"]}</option>
          </select>

          <select
            value={categoryValue}
            onChange={(e) => setCategoryValue(e.target.value)}
          >
            <option value="">{t.allCategories}</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {dict.categoryLabels[category] || category}
              </option>
            ))}
          </select>

          <select
            value={currentSeasonTab}
            onChange={(e) => setSeasonTab(e.target.value)}
          >
            <option value="all">{t.allSeasons}</option>
            <option value="summer">{t.seasonSummer}</option>
            <option value="winter">{t.seasonWinter}</option>
            <option value="spring-autumn">{t.seasonSpringAutumn}</option>
          </select>

          <select
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
          >
            <option value="">{t.allPrices}</option>
            <option value="0-150">{t.priceUnder150}</option>
            <option value="150-300">{t.price150to300}</option>
            <option value="300-500">{t.price300to500}</option>
            <option value="500-9999">{t.priceOver500}</option>
          </select>

          <button
            className={commonStyles.btn}
            style={{ flex: "0 0 auto", minWidth: "130px" }}
            onClick={openCartOrAuth}
          >
            🛒 {t.cart} ({cartCount})
          </button>
        </div>
      </div>

      <div className={browseStyles.tabsSticky}>
        <div className={browseStyles.pageHeader}>
          <div className={commonStyles.pageTitle}>{t.pageTitle}</div>

          {showCatalogBanners && seasonBannerVisible && (
            <div className={`${browseStyles.seasonBanner} ${seasonBannerClass}`}>
              <span className={browseStyles.seasonEmoji}>{seasonEmoji}</span>
              <span className={browseStyles.seasonText}>{seasonText}</span>
            </div>
          )}

          {isGuest && (
            <div className={browseStyles.guestCatalogBanner}>
              <div className={browseStyles.gbt}>
                👀 {t.guestBannerPart1}<strong>{t.guestBannerGuestWord}</strong>{t.guestBannerPart2}<strong>{t.guestBannerLoginWord}</strong>{t.guestBannerPart3}
              </div>
              <button
                className={`${commonStyles.btn} ${commonStyles.btnGold}`}
                style={{ padding: "0.5rem 1rem", fontSize: "0.86rem" }}
                onClick={goLogin}
              >
                {t.loginButton}
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
            {t.tabAll}
          </button>
          <button
            className={`${commonStyles.tabBtn} ${
              currentListMode === "trending" ? commonStyles.activeTab : ""
            }`}
            onClick={() => setListMode("trending")}
          >
            {t.tabTrending}
          </button>
          <button
            className={`${commonStyles.tabBtn} ${
              currentListMode === "bestsellers" ? commonStyles.activeTab : ""
            }`}
            onClick={() => setListMode("bestsellers")}
          >
            {t.tabBestsellers}
          </button>
          <button
            className={`${commonStyles.tabBtn} ${
              currentListMode === "sale" ? commonStyles.activeTab : ""
            }`}
            onClick={() => setListMode("sale")}
          >
            {t.tabSale}
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
          {t.noResults}
        </div>
      )}
    </div>
  );
}