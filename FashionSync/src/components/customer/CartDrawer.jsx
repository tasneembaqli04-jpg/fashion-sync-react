import modalStyles from "../../styles/customer/CustomerModals.module.scss";

export default function CartDrawer({
  open = false,
  cart = [],
  cartPoints = 0,
  cartTotal = 0,
  discountText = "",
  couponValue = "",
  setCouponValue,
  closeCart,
  changeQty,
  removeItem,
  applyCoupon,
  startCheckout,
}) {
  console.log("CartDrawer open =", open);
  return (
    <>
      <div
        className={`${modalStyles.backdrop} ${open ? modalStyles.backdropShow : ""}`}
        onClick={closeCart}
      />

      <div
        className={`${modalStyles.drawer} ${open ? modalStyles.drawerOpen : ""}`}
      >
        <div className={modalStyles.drawerHead}>
          <div className={modalStyles.drawerTitle}>🛒 סל הקניות</div>
          <button className={modalStyles.drawerClose} onClick={closeCart}>
            ✕
          </button>
        </div>

        <div className={modalStyles.drawerBody}>
          {cart.length ? (
            cart.map((item) => {
              const isSale =
                item.sale &&
                item.originalPrice &&
                item.originalPrice > item.price;

              return (
                <div className={modalStyles.cartItem} key={item.key}>
                  <div className={modalStyles.cartLeft}>
                    <img src={item.img} alt={item.name} />
                    <div style={{ minWidth: 0 }}>
                      <div className={modalStyles.cartName}>{item.name}</div>
                      <div className={modalStyles.cartMeta}>
                        {item.code}
                        {item.size ? ` · ${item.size}` : ""}
                        {item.color ? ` · ${item.color}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className={modalStyles.qtyControls}>
                    <button
                      className={modalStyles.qtyBtn}
                      onClick={() => changeQty(item.key, -1)}
                    >
                      −
                    </button>

                    <div className={modalStyles.qtyNum}>{item.qty}</div>

                    <button
                      className={modalStyles.qtyBtn}
                      onClick={() => changeQty(item.key, 1)}
                    >
                      +
                    </button>

                    <div className={modalStyles.cartPrice}>
                      {isSale ? (
                        <>
                          <span className={modalStyles.oldItemPrice}>
                            ₪{item.originalPrice}
                          </span>{" "}
                          <span className={modalStyles.saleItemPrice}>
                            ₪{item.price * item.qty}
                          </span>
                        </>
                      ) : (
                        <>₪{item.price * item.qty}</>
                      )}
                    </div>

                    <button
                      className={modalStyles.rmBtn}
                      onClick={() => removeItem(item.key)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={modalStyles.emptyCart}>
              <div className={modalStyles.emptyCartIcon}>🛒</div>
              אין פריטים בעגלה
            </div>
          )}
        </div>

        <div className={modalStyles.drawerFoot}>
          <div className={modalStyles.pointsRow}>
            ⭐ תצבור <span>{cartPoints}</span> נקודות על הזמנה זו
          </div>

          <div className={modalStyles.couponRow}>
            <input
              className={modalStyles.couponInput}
              type="text"
              placeholder="קוד קופון..."
              value={couponValue}
              onChange={(e) => setCouponValue(e.target.value)}
            />
            <button className={modalStyles.couponApply} onClick={applyCoupon}>
              החל
            </button>
          </div>

          {discountText && (
            <div className={modalStyles.discountRow}>
              ✅ הנחה הוחלה: <span>{discountText}</span>
            </div>
          )}

          <div className={modalStyles.totalRow}>
            <span className={modalStyles.totalLabel}>סה"כ לתשלום:</span>
            <span className={modalStyles.totalVal}>₪{cartTotal}</span>
          </div>

          <button className={modalStyles.checkoutBtn} onClick={startCheckout}>
            ✅ מעבר לתשלום
          </button>
        </div>
      </div>
    </>
  );
}