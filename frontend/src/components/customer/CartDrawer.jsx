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
  availablePoints = 0,
  pointsInput = "",
  setPointsInput,
  applyPointsRedemption,
  removePointsRedemption,
  appliedPointsRedeemed = 0,
  pointsDiscountAmount = 0,
}) {
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
                          </span>{" "}
                          <span
                            style={{
                              color: "var(--red)",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                            }}
                          >
                            (-
                            {Math.round(
                              ((item.originalPrice - item.price) /
                                item.originalPrice) *
                                100
                            )}
                            %)
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

          {availablePoints > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <div className={modalStyles.couponRow}>
                <input
                  className={modalStyles.couponInput}
                  type="number"
                  min="1"
                  max={availablePoints}
                  placeholder={`כמה נקודות להשתמש? (יש לך ${availablePoints.toLocaleString()})`}
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                />
                <button
                  className={modalStyles.couponApply}
                  onClick={applyPointsRedemption}
                >
                  השתמש
                </button>
              </div>

              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--light-gray)",
                  marginTop: "0.25rem",
                }}
              >
                כל 20 נק' = ₪1 — {pointsInput && Number(pointsInput) > 0
                  ? `זה שווה ₪${(Number(pointsInput) * 0.05).toFixed(2)} הנחה`
                  : `סה"כ יש לך ₪${(availablePoints * 0.05).toFixed(2)} זמינים`}
              </div>
            </div>
          )}

          {appliedPointsRedeemed > 0 && (
            <div
              className={modalStyles.discountRow}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>
                ✅ נוצלו {appliedPointsRedeemed.toLocaleString()} נק' = ₪
                {pointsDiscountAmount.toFixed(2)} הנחה
              </span>
              <button
                onClick={removePointsRedemption}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
              >
                ✕
              </button>
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