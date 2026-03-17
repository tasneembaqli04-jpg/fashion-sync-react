import commonStyles from "../../styles/customer/Customer.module.scss";
import browseStyles from "../../styles/customer/CustomerBrowse.module.scss";
import ProductCard from "./ProductCard";

export default function CustomerWishlist({
  show,
  wishlistProducts = [],
  isGuest,
  openProductModal,
  toggleWish,
  addToCart,
  openTryOnFromProduct,
  openShareModal,
  openNotifyModal,
  guestPrompt,
}) {
  if (!show) return null;

  return (
    <div>
      <div className={commonStyles.pageTitle}>❤️ רשימת הבקשות שלי</div>
      <div className={commonStyles.pageSub}>פריטים ששמרת לאחר כך</div>

      {wishlistProducts.length ? (
        <div className={browseStyles.wishGrid}>
          {wishlistProducts.map((product) => (
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
          רשימת הבקשות ריקה.
        </div>
      )}
    </div>
  );
}