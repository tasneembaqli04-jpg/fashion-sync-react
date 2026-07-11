import cardStyles from "../../styles/customer/ProductCard.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";

const CATEGORY_SIZE_OPTIONS = {
  חולצות: ["S", "M", "L", "XL"],
  מכנסיים: ["28", "30", "32", "34"],
  שמלות: ["S", "M", "L", "XL"],
  עליוניות: ["S", "M", "L", "XL"],
  נעליים: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  אביזרים: ["אחיד"],
};

function variantSummary(product) {
  if (!Array.isArray(product.variants) || !product.variants.length) {
    return { colors: [], sizes: [] };
  }

  const colors = [
    ...new Set(product.variants.map((v) => v.colorName).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "he"));

  const canonicalOrder = CATEGORY_SIZE_OPTIONS[product.cat] || [];
  const sizes = [
    ...new Set(
      product.variants.flatMap((v) => Object.keys(v.sizes || {}))
    ),
  ].sort(
    (a, b) => canonicalOrder.indexOf(a) - canonicalOrder.indexOf(b)
  );

  return { colors, sizes };
}

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
    summer: "badgeSummer",
    winter: "badgeWinter",
    "spring-autumn": "badgeSpring",
    all: "badgeAll",
  };

  const iconMap = {
    summer: "☀️",
    winter: "❄️",
    "spring-autumn": "🌸",
    all: "🗓️",
  };

  const labelMap = {
    summer: "קיץ",
    winter: "חורף",
    "spring-autumn": "אביב / סתיו",
    all: "כל השנה",
  };

  const cls = classMap[season] || "badgeAll";
  const icon = iconMap[season] || "🗓️";
  const label = labelMap[season] || season;

  return (
    <div className={`${cardStyles.seasonBadgeCard} ${cardStyles[cls]}`}>
      {icon} {label}
    </div>
  );
}

function priceHtml(product) {
  if (
    product.sale &&
    product.originalPrice &&
    product.originalPrice > product.price
  ) {
    const discountPct = Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100
    );

    return (
      <div className={cardStyles.priceRow}>
        <span className={cardStyles.productPriceOriginal}>
          ₪{product.originalPrice}
        </span>
        <span className={`${cardStyles.productPrice} ${cardStyles.salePrice}`}>
          ₪{product.price}
        </span>
        <span className={cardStyles.saleInlineTag}>🏷️ -{discountPct}%</span>
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
  cart = [],
  openProductModal,
  toggleWish,
  addToCart,
  openTryOnFromProduct,
  openShareModal,
  openNotifyModal,
  guestPrompt,
}) {
  const cartItem = cart.find((item) => item.code === product.code);
  const isInCart = Boolean(cartItem);
  const cartQty = cartItem ? cartItem.qty : 0;
  const { colors, sizes } = variantSummary(product);

  const saleDiscountPct =
    product.sale && product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0;

  const badgeHtml = product.sale ? (
    <div className={cardStyles.saleRibbon}>🏷️ -{saleDiscountPct}%</div>
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
            onClick={(e) => { e.stopPropagation(); guestPrompt(); }}
            title="התחבר"
          >
            🔒
          </button>
        ) : (
          <button
            className={`${cardStyles.wishIcon} ${product.wished ? cardStyles.active : ""}`}
            onClick={(e) => { e.stopPropagation(); toggleWish(product.code); }}
          >
            {product.wished ? "❤️" : "🤍"}
          </button>
        )}

        <button
          className={cardStyles.shareIcon}
          onClick={(e) => { e.stopPropagation(); openShareModal(product.code); }}
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
          {(colors.length > 0 || sizes.length > 0) && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--light-gray)",
                marginTop: "0.25rem",
              }}
            >
              {colors.length > 0 && <div>צבעים: {colors.join(", ")}</div>}
              {sizes.length > 0 && <div>מידות: {sizes.join(", ")}</div>}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {priceHtml(product)}
          {stockBadge(product.stock, product.minStock)}
        </div>

        <div className={cardStyles.cardActions} onClick={(e) => e.stopPropagation()}>
          {isGuest ? (
            <button
              className={`${cardStyles.actBtn} ${cardStyles.guestLocked}`}
              onClick={guestPrompt}
            >
              🔒 הוסף לסל
            </button>
          ) : isInCart ? (
            <button
              className={`${cardStyles.actBtn} ${cardStyles.inCartBtn}`}
              onClick={(e) => { e.stopPropagation(); openProductModal(product.code); }}
              disabled={product.stock === 0}
            >
              ✓ בסל ({cartQty}) – הוסף עוד
            </button>
          ) : (
            <button
              className={`${cardStyles.actBtn} ${cardStyles.goldBtn}`}
              onClick={(e) => { e.stopPropagation(); openProductModal(product.code); }}
              disabled={product.stock === 0}
            >
              🛒 הוסף לסל
            </button>
          )}

          <button
            className={cardStyles.actBtn}
            onClick={(e) => { e.stopPropagation(); openTryOnFromProduct(product.code); }}
          >
            📷 נסה עליי
          </button>
        </div>

        {product.stock === 0 && (
          <button
            className={cardStyles.notifyBtn}
            id={`nb-${product.code}`}
            onClick={(e) => { e.stopPropagation(); openNotifyModal(product.code); }}
          >
            🔔 הודע לי שיחזור למלאי
          </button>
        )}
      </div>
    </div>
  );
}