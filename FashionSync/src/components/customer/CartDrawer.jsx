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
  return (
    <>
      <div
        className={`${modalStyles.backdrop} ${open ? modalStyles.show : ""}`}
        id="backdrop"
        onClick={closeCart}
      />

      <div
        className={`${modalStyles.drawer} ${open ? modalStyles.open : ""}`}
        id="cart-drawer"
      >
        <div className={modalStyles.drawerHead}>
          <div className={modalStyles.drawerTitle}>🛒 סל הקניות</div>
          <button className={modalStyles.drawerClose} onClick={closeCart}>
            ✕
          </button>
        </div>

        <div className={modalStyles.drawerBody} id="cart-body">
          {cart.length ? (
            cart.map((item) => (
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
                    ₪{item.price * item.qty}
                  </div>

                  <button
                    className={modalStyles.rmBtn}
                    onClick={() => removeItem(item.key)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "2.5rem",
                color: "var(--light-gray)",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: ".8rem" }}>🛒</div>
              אין פריטים בעגלה
            </div>
          )}
        </div>

        <div className={modalStyles.drawerFoot}>
          <div className={modalStyles.pointsRow}>
            ⭐ תצבור <span id="cart-points">{cartPoints}</span> נקודות על הזמנה זו
          </div>

          <div className={modalStyles.couponRow}>
            <input
              className={modalStyles.couponInput}
              id="coupon-input"
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
            <div
              id="discount-row"
              style={{
                color: "var(--green)",
                fontSize: "0.86rem",
                marginBottom: "0.6rem",
              }}
            >
              ✅ הנחה הוחלה: <span id="discount-val">{discountText}</span>
            </div>
          )}

          <div className={modalStyles.totalRow}>
            <span className={modalStyles.totalLabel}>סה"כ לתשלום:</span>
            <span className={modalStyles.totalVal} id="cart-total">
              ₪{cartTotal}
            </span>
          </div>

          <button className={modalStyles.checkoutBtn} onClick={startCheckout}>
            ✅ מעבר לתשלום
          </button>
        </div>
      </div>
    </>
  );
}