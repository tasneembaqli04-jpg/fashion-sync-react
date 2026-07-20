import { useEffect, useState } from "react";
import commonStyles from "../../styles/customer/Customer.module.scss";
import browseStyles from "../../styles/customer/CustomerBrowse.module.scss";
import { getAllCoupons } from "../../services/coupons/couponsService";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CustomerLoyalty({ show, copyCoupon, points = 0 }) {
  const { t: dict } = useLanguage();
  const t = dict.customer.loyalty;

  const SEASON_LABELS = {
    summer: t.seasonSummerOnly,
    winter: t.seasonWinterOnly,
    "spring-autumn": t.seasonSpringAutumnOnly,
  };

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
      <div className={commonStyles.pageTitle}>{t.title}</div>
      <div className={commonStyles.pageSub}>{t.subtitle}</div>

      <div className={browseStyles.pointsCard}>
        <div
          style={{
            color: "var(--light-gray)",
            fontSize: "0.86rem",
            marginBottom: "0.3rem",
          }}
        >
          {t.myPoints}
        </div>

        <div className={browseStyles.pointsAmount}>
          {points.toLocaleString()} {t.pointsAbbrev}
        </div>

        <div
          style={{
            color: "var(--light-gray)",
            fontSize: "0.8rem",
            marginTop: "0.4rem",
          }}
        >
          = ₪{redemptionValue} {t.redemptionSuffix}
        </div>
      </div>

      <div className={commonStyles.secTitle}>{t.myCoupons}</div>

      <div className={browseStyles.couponList}>
        {!coupons.length ? (
          <div style={{ color: "var(--light-gray)", padding: "0.8rem" }}>
            {t.noActiveCoupons}
          </div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon.code} className={browseStyles.couponItem}>
              <div>
                <div className={browseStyles.couponCodeDisplay}>
                  {coupon.code}
                </div>
                <div className={browseStyles.couponDesc}>
                  {Math.round(coupon.discount * 100)}{t.discountSuffix}
                  {coupon.seasonOnly
                    ? ` — ${SEASON_LABELS[coupon.seasonOnly] || ""}`
                    : ` ${t.onEntirePurchase}`}
                </div>
              </div>

              <button
                className={`${commonStyles.btn} ${commonStyles.btnGold}`}
                onClick={(e) => copyCoupon(coupon.code, e.currentTarget)}
              >
                {t.copy}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}