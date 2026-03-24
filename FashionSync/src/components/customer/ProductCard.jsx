import cardStyles from "../../styles/customer/ProductCard.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";

function stockBadge(stock, minStock) {
  if (stock === 0) {
    return (
      <span className={`${baseStyles.badge} ${baseStyles.badgeRed}`}>
        מלאי אזל
      </span>
    );
  }

  if (stock <= minStock) {
    return (
      <span className={`${baseStyles.badge} ${baseStyles.badgeYellow}`}>
        מלאי נמוך
      </span>
    );
  }

  return (
    <span className={`${baseStyles.badge} ${baseStyles.badgeGreen}`}>זמין</span>
  );
}

function seasonBadge(product) {
  const season = Array.isArray(product.season)
    ? product.season[0]
    : product.season;

  const classMap = {
    קיץ: "summer",
    חורף: "winter",
    "אביב-סתיו": "spring",
    "כל השנה": "all",
  };

  const iconMap = {
    קיץ: "☀️",
    חורף: "❄️",
    "אביב-סתיו": "🌸",
    "כל השנה": "🗓️",
  };

  return (
    <div
      className={`${cardStyles.seasonBadgeCard} ${
        cardStyles[classMap[season]] || cardStyles.all
      }`}
    >
      {iconMap[season] || "🗓️"}{" "}
      {Array.isArray(product.season)
        ? product.season.join(" / ")
        : product.season}
    </div>
  );
}

function priceHtml(product) {
  if (
    product.sale &&
    product.originalPrice &&
    product.originalPrice > product.price
  ) {
    return (
      <div className={cardStyles.priceRow}>
        <span className={cardStyles.productPriceOriginal}>
          ₪{product.originalPrice}
        </span>
        <span
          className={`${cardStyles.productPrice} ${cardStyles.salePrice}`}
        >
          ₪{product.price}
        </span>
        <span className={cardStyles.saleInlineTag}>🏷️ -20%</span>
      </div>
    );
  }

  return (
    <div className={cardStyles.priceRow}>
      <span className={cardStyles.productPrice}>₪{product.price}</span>
    </div>
  );
}

export default function ProductCard({
  product,
  isGuest,
  openProductModal,
  toggleWish,
  addToCart,
  openTryOnFromProduct,
  openShareModal,
  openNotifyModal,
  guestPrompt,
}) {
  const badgeHtml = product.sale ? (
    <div className={cardStyles.saleRibbon}>🏷️ -20%</div>
  ) : product.trending ? (
    <div className={cardStyles.trendingBadge}>🔥 טרנד</div>
  ) : product.bestseller ? (
    <div className={cardStyles.bestsellerBadge}>⭐ נמכר</div>
  ) : null;

  return (
    <div
      className={cardStyles.productCard}
      onClick={() => openProductModal(product.code)}
    >
      <div className={cardStyles.productImgWrap}>
        <img src={product.img} alt={product.name} loading="lazy" />
        {badgeHtml}

        {isGuest ? (
          <button
            className={cardStyles.wishIcon}
            onClick={(e) => {
              e.stopPropagation();
              guestPrompt();
            }}
            title="התחבר"
          >
            🔒
          </button>
        ) : (
          <button
            className={`${cardStyles.wishIcon} ${
              product.wished ? cardStyles.active : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleWish(product.code);
            }}
          >
            {product.wished ? "❤️" : "🤍"}
          </button>
        )}

        <button
          className={cardStyles.shareIcon}
          onClick={(e) => {
            e.stopPropagation();
            openShareModal(product.code);
          }}
        >
          📤
        </button>

        {seasonBadge(product)}
      </div>

      <div className={cardStyles.productBody}>
        <div>
          <div className={cardStyles.productName}>{product.name}</div>
          <div className={cardStyles.productCode}>
            {product.code} · {product.gender} · {product.cat}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {priceHtml(product)}
          {stockBadge(product.stock, product.minStock)}
        </div>

        <div
          className={cardStyles.cardActions}
          onClick={(e) => e.stopPropagation()}
        >
          {isGuest ? (
            <button
              className={`${cardStyles.actBtn} ${cardStyles.guestLocked}`}
              onClick={guestPrompt}
            >
              🔒 הוסף לסל
            </button>
          ) : (
            <button
              className={`${cardStyles.actBtn} ${cardStyles.goldBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                console.log("clicked add button", product.code);
                addToCart(product.code);
              }}
              disabled={product.stock === 0}
            >
              🛒 הוסף לסל
            </button>
          )}

          <button
            className={cardStyles.actBtn}
            onClick={() => openTryOnFromProduct(product.code)}
          >
            📷 נסה עליי
          </button>
        </div>

        {product.stock === 0 && (
          <button
            className={cardStyles.notifyBtn}
            id={`nb-${product.code}`}
            onClick={(e) => {
              e.stopPropagation();
              openNotifyModal(product.code);
            }}
          >
            🔔 הודע לי שיחזור למלאי
          </button>
        )}
      </div>
    </div>
  );
}