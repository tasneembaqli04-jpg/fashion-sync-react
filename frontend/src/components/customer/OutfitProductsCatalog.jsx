import styles from "../../styles/customer/OutfitProductsCatalog.module.scss";

export default function OutfitProductsCatalog({
  products = [],
  openProductModal,
  onAddAll,
  title = "מוצרים מתאימים",
}) {
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
              alt={product.name}
              className={styles.image}
            />

            <div className={styles.name}>
              {product.name}
            </div>

            <div className={styles.price}>
              ₪{product.price}
            </div>

            {/* הכפתור של המוצר הבודד חייב להיות כאן,
                בתוך ה-map ובתוך הכרטיס */}
            <button
              type="button"
              className={styles.addToCartBtn}
              onClick={() => openProductModal?.(product.code)}
            >
              🛒 הוסף לסל
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}