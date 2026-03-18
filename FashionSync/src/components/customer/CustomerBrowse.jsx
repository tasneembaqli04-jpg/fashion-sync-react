import commonStyles from "../../styles/customer/Customer.module.scss";
import browseStyles from "../../styles/customer/CustomerBrowse.module.scss";
import ProductCard from "./ProductCard";

export default function CustomerBrowse({
  show = false,
  isGuest,
  saleBannerVisible,
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
  products,
  currentListMode,
  setSearchValue,
  setGenderValue,
  setCategoryValue,
  setPriceValue,
  setSaleValue,
  openVisualModal,
  goLogin,
  filterSaleOnly,
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
      <div className={commonStyles.pageTitle}>🏬 קטלוג מוצרים</div>
      <div className={commonStyles.pageSub}>חפש לפי מגדר, קטגוריה ועונה</div>

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

      {saleBannerVisible && (
        <div className={browseStyles.saleCatalogBanner}>
          <div className={browseStyles.sbt}>
            🏷️ <strong>מבצע מיוחד!</strong> פריטים נבחרים עם הנחה – לזמן מוגבל
          </div>

          <button
            className={commonStyles.btn}
            style={{
              background: "linear-gradient(135deg, #8e44ad, #a855f7)",
              color: "#fff",
              padding: "0.5rem 1rem",
              fontSize: "0.86rem",
            }}
            onClick={filterSaleOnly}
          >
            🛍️ הצג מבצעים
          </button>
        </div>
      )}

      {seasonBannerVisible && (
        <div className={`${browseStyles.seasonBanner} ${seasonBannerClass}`}>
          <span className={browseStyles.seasonEmoji}>{seasonEmoji}</span>
          <span className={browseStyles.seasonText}>{seasonText}</span>
        </div>
      )}

      <div className={browseStyles.seasonTabs}>
        <button
          className={`${browseStyles.seasonTab} ${
            currentSeasonTab === "all" ? browseStyles.activeAll : ""
          }`}
          onClick={() => setSeasonTab("all")}
        >
          ✨ כל העונות
        </button>

        <button
          className={`${browseStyles.seasonTab} ${
            currentSeasonTab === "קיץ" ? browseStyles.activeSummer : ""
          }`}
          onClick={() => setSeasonTab("קיץ")}
        >
          ☀️ קיץ
        </button>

        <button
          className={`${browseStyles.seasonTab} ${
            currentSeasonTab === "חורף" ? browseStyles.activeWinter : ""
          }`}
          onClick={() => setSeasonTab("חורף")}
        >
          ❄️ חורף
        </button>

        <button
          className={`${browseStyles.seasonTab} ${
            currentSeasonTab === "אביב-סתיו" ? browseStyles.activeSpring : ""
          }`}
          onClick={() => setSeasonTab("אביב-סתיו")}
        >
          🌸 אביב / סתיו
        </button>
      </div>

      <div className={browseStyles.filterBar}>
        <div className={browseStyles.filterLeft}>
          <button
            className={browseStyles.cameraBtn}
            title="חיפוש חזותי"
            onClick={openVisualModal}
          >
            📷
          </button>

          <input
            type="text"
            placeholder="שם, קוד..."
            style={{ minWidth: "160px" }}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
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
            <option value="חולצות">חולצות</option>
            <option value="מכנסיים">מכנסיים</option>
            <option value="שמלות">שמלות</option>
            <option value="עליוניות">עליוניות</option>
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

          <select
            value={saleValue}
            onChange={(e) => setSaleValue(e.target.value)}
          >
            <option value="">כל הפריטים</option>
            <option value="sale">🏷️ במבצע בלבד</option>
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
          ⭐ נמכרים
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

      {products?.length ? (
        <div className={browseStyles.productsGrid}>
          {products.map((product) => (
            <ProductCard
              key={product.code}
              product={product}
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