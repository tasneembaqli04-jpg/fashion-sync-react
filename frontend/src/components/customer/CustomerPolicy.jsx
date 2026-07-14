import commonStyles from "../../styles/customer/Customer.module.scss";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";

export default function CustomerPolicy({ show }) {
  if (!show) return null;

  return (
    <div>
      <div className={commonStyles.pageTitle}>📋 מדיניות והחזרות</div>
      <div className={commonStyles.pageSub}>כל המידע שאתה צריך לדעת</div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>🔄 מדיניות החזרות</div>
        <div className={modalStyles.policyText}>
          ניתן להחזיר פריטים תוך 30 יום מיום הרכישה, בתנאי שהם במצב מקורי עם תגיות.
          החזרה מלאה לכרטיס האשראי או כזיכוי לחנות.
          פריטי מכירה סופית אינם ניתנים להחזרה.
        </div>
      </div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>🚚 מדיניות משלוחים</div>
        <div className={modalStyles.policyText}>
          משלוח רגיל: 5–7 ימי עסקים — ₪25 (חינם לרכישות מעל ₪200)
          <br />
          משלוח מהיר: 2–3 ימי עסקים — ₪29
          <br />
          משלוח באותו יום: עד 23:59 היום — ₪59 (מרכז בלבד)
          <br />
          איסוף עצמי: מחר 10:00–20:00, חינם — הרצל 42, ת״א
        </div>
      </div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>🔒 פרטיות ואבטחה</div>
        <div className={modalStyles.policyText}>
          אנחנו לא שומרים פרטי כרטיס אשראי. כל העסקאות מוצפנות.
          <br />
          לא נמכור את פרטיך לצד שלישי.
        </div>
      </div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>📞 יצירת קשר</div>
        <div className={modalStyles.policyText}>
          טלפון: 03-000-0000 (א–ה 9:00–18:00)
          <br />
          אימייל: support@fashionsync.co.il
        </div>
      </div>
    </div>
  );
}