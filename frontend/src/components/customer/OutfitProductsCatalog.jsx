import styles from "../../styles/customer/OutfitProductsCatalog.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";
import { getItemName } from "../../functions/customer/itemDisplay";

export default function OutfitProductsCatalog({
  products = [],
  openProductModal,
  onAddAll,
  // No default. The caller holds the dictionary and passes a translated
  // heading; a Hebrew literal here would surface in the English interface the
  // moment a caller forgot to.
  title = "",
}) {
  const { t: dict, lang } = useLanguage();

  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>🛍️ {title}</div>

      <div className={styles.products}>
        {products.map((product) => (
          <div
            key={product.code}
            className={styles.card}
          >
            <img
              src={product.imageUrl || product.img}
              alt={getItemName(product, lang)}
              className={styles.image}
            />

            <div className={styles.name}>
              {getItemName(product, lang)}
            </div>

            <div className={styles.price}>
              ₪{product.price}
            </div>

            {/* This button must stay inside the map and inside the card,
                so each product gets its own button */}
            <button
              type="button"
              className={styles.addToCartBtn}
              onClick={() => openProductModal?.(product.code)}
            >
              {dict.customer.productCard.addToCart}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}