import { useEffect, useState } from "react";
import commonStyles from "../../styles/customer/Customer.module.scss";
import browseStyles from "../../styles/customer/CustomerBrowse.module.scss";
import { getAllCoupons } from "../../../backend/services/coupons/couponsService";

const SEASON_LABELS = {
  summer: "בקיץ בלבד",
  winter: "בחורף בלבד",
  "spring-autumn": "באביב/סתיו בלבד",
};

export default function CustomerLoyalty({ show, copyCoupon, points = 0 }) {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    if (!show) return;

    getAllCoupons().then((allCoupons) => {
      setCoupons(allCoupons.filter((coupon) => coupon.active));
    });
  }, [show]);

  if (!show) return null;

  const redemptionValue = (points * 0.05).toFixed(2);

  return (
    <div>
      <div className={commonStyles.pageTitle}>⭐ נקודות וקופונים</div>
      <div className={commonStyles.pageSub}>הטבות בלעדיות עבורך</div>

      <div className={browseStyles.pointsCard}>
        <div
          style={{
            color: "var(--light-gray)",
            fontSize: "0.86rem",
            marginBottom: "0.3rem",
          }}
        >
          הנקודות שלי
        </div>

        <div className={browseStyles.pointsAmount}>
          {points.toLocaleString()} נק'
        </div>

        <div
          style={{
            color: "var(--light-gray)",
            fontSize: "0.8rem",
            marginTop: "0.4rem",
          }}
        >
          = ₪{redemptionValue} לשימוש בקנייה הבאה
        </div>
      </div>

      <div className={commonStyles.secTitle}>הקופונים שלי</div>

      <div className={browseStyles.couponList}>
        {!coupons.length ? (
          <div style={{ color: "var(--light-gray)", padding: "0.8rem" }}>
            אין כרגע קופונים פעילים
          </div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon.code} className={browseStyles.couponItem}>
              <div>
                <div className={browseStyles.couponCodeDisplay}>
                  {coupon.code}
                </div>
                <div className={browseStyles.couponDesc}>
                  {Math.round(coupon.discount * 100)}% הנחה על כל הקנייה
                  {coupon.seasonOnly &&
                    ` — ${SEASON_LABELS[coupon.seasonOnly] || ""}`}
                </div>
              </div>

              <button
                className={`${commonStyles.btn} ${commonStyles.btnGold}`}
                onClick={(e) => copyCoupon(coupon.code, e.currentTarget)}
              >
                העתק
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}