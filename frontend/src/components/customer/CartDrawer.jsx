import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

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
  const { t: dict } = useLanguage();
  const t = dict.customer.cart;

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
          <div className={modalStyles.drawerTitle}>{t.title}</div>
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
              {t.empty}
            </div>
          )}
        </div>

        <div className={modalStyles.drawerFoot}>
          <div className={modalStyles.pointsRow}>
            {t.earnPoints.replace("{points}", cartPoints)}
          </div>

          <div className={modalStyles.couponRow}>
            <input
              className={modalStyles.couponInput}
              type="text"
              placeholder={t.couponPlaceholder}
              value={couponValue}
              onChange={(e) => setCouponValue(e.target.value)}
            />
            <button className={modalStyles.couponApply} onClick={applyCoupon}>
              {t.apply}
            </button>
          </div>

          {discountText && (
            <div className={modalStyles.discountRow}>
              {t.discountApplied} <span>{discountText}</span>
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
                  placeholder={t.pointsPlaceholder.replace(
                    "{points}",
                    availablePoints.toLocaleString()
                  )}
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                />
                <button
                  className={modalStyles.couponApply}
                  onClick={applyPointsRedemption}
                >
                  {t.usePoints}
                </button>
              </div>

              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--light-gray)",
                  marginTop: "0.25rem",
                }}
              >
                {t.pointsRate}
                {pointsInput && Number(pointsInput) > 0
                  ? t.pointsWorth.replace(
                      "{amount}",
                      (Number(pointsInput) * 0.05).toFixed(2)
                    )
                  : t.pointsAvailable.replace(
                      "{amount}",
                      (availablePoints * 0.05).toFixed(2)
                    )}
              </div>
            </div>
          )}

          {appliedPointsRedeemed > 0 && (
            <div
              className={modalStyles.discountRow}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>
                {t.pointsRedeemed
                  .replace("{points}", appliedPointsRedeemed.toLocaleString())
                  .replace("{amount}", pointsDiscountAmount.toFixed(2))}
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
            <span className={modalStyles.totalLabel}>{t.totalLabel}</span>
            <span className={modalStyles.totalVal}>₪{cartTotal}</span>
          </div>

          <button className={modalStyles.checkoutBtn} onClick={startCheckout}>
            {t.checkout}
          </button>
        </div>
      </div>
    </>
  );
}