import commonStyles from "../../styles/customer/Customer.module.scss";
import browseStyles from "../../styles/customer/CustomerBrowse.module.scss";

export default function CustomerLoyalty({ show, copyCoupon }) {
  if (!show) return null;

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

        <div className={browseStyles.pointsAmount}>1,250 נק'</div>

        <div
          style={{
            color: "var(--light-gray)",
            fontSize: "0.8rem",
            marginTop: "0.4rem",
          }}
        >
          = ₪62.5 לשימוש בקנייה הבאה
        </div>
      </div>

      <div className={commonStyles.secTitle}>הקופונים שלי</div>

      <div className={browseStyles.couponList}>
        {[
          ["SAVE20", "20% הנחה על כל הקנייה"],
          ["FREE50", "משלוח חינם + ₪50 הנחה"],
          ["SUMMER15", "15% על פריטי קיץ"],
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