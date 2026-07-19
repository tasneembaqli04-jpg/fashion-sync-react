import commonStyles from "../../styles/customer/Customer.module.scss";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CustomerPolicy({ show }) {
  const { t: dict } = useLanguage();
  const t = dict.customer.policy;

  if (!show) return null;

  return (
    <div>
      <div className={commonStyles.pageTitle}>{t.title}</div>
      <div className={commonStyles.pageSub}>{t.subtitle}</div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>{t.returnsTitle}</div>
        <div className={modalStyles.policyText}>
          {t.returnsText}
        </div>
      </div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>{t.shippingTitle}</div>
        <div className={modalStyles.policyText}>
          {t.shippingLine1}
          <br />
          {t.shippingLine2}
          <br />
          {t.shippingLine3}
          <br />
          {t.shippingLine4}
        </div>
      </div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>{t.privacyTitle}</div>
        <div className={modalStyles.policyText}>
          {t.privacyLine1}
          <br />
          {t.privacyLine2}
        </div>
      </div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>{t.contactTitle}</div>
        <div className={modalStyles.policyText}>
          {t.contactPhone}
          <br />
          {t.contactEmail}
        </div>
      </div>
    </div>
  );
}