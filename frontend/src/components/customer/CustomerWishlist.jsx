import commonStyles from "../../styles/customer/Customer.module.scss";
import browseStyles from "../../styles/customer/CustomerBrowse.module.scss";
import ProductCard from "./ProductCard";
import { useLanguage } from "../../translations/LanguageProvider";

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
  const { t: dict } = useLanguage();
  const t = dict.customer.wishlist;

  if (!show) return null;

  return (
    <div>
      <div className={commonStyles.pageTitle}>{t.title}</div>
      <div className={commonStyles.pageSub}>{t.subtitle}</div>

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
          {t.empty}
        </div>
      )}
    </div>
  );
}