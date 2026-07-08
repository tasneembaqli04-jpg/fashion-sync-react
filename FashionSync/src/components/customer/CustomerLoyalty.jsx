import commonStyles from "../../styles/customer/Customer.module.scss";
import browseStyles from "../../styles/customer/CustomerBrowse.module.scss";

export default function CustomerLoyalty({ show, copyCoupon, points = 0 }) {
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

        <div className={browseStyles.pointsAmount}>{points.toLocaleString()} נק'</div>

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
        {[
          ["SAVE20", "20% הנחה על כל הקנייה"],
          ["FREE50", "10% הנחה על כל הקנייה"],
          ["SUMMER15", "15% הנחה על כל הקנייה"],
        ].map(([code, desc]) => (
          <div key={code} className={browseStyles.couponItem}>
            <div>
              <div className={browseStyles.couponCodeDisplay}>{code}</div>
              <div className={browseStyles.couponDesc}>{desc}</div>
            </div>

            <button
              className={`${commonStyles.btn} ${commonStyles.btnGold}`}
              onClick={(e) => copyCoupon(code, e.currentTarget)}
            >
              העתק
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}