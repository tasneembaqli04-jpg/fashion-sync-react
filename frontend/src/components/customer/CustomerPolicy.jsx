import { useEffect, useState } from "react";
import commonStyles from "../../styles/customer/Customer.module.scss";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";
import { useDialog } from "../common/DialogProvider";
import { submitContactMessage } from "../../services/contact/contactMessagesService";
import { sendContactNotificationEmail } from "../../services/email/emailService";
import { getBusinessHours } from "../../services/settings/businessHoursService";
import { getPolicyContent } from "../../services/settings/policyContentService";
import { getStoreDetails } from "../../services/settings/storeDetailsService";

export default function CustomerPolicy({ show, currentUser }) {
  const { t: dict, lang } = useLanguage();
  const t = dict.customer.policy;
  const { alertDialog } = useDialog();

  const [contactName, setContactName] = useState(currentUser?.name || "");
  const [contactEmail, setContactEmail] = useState(currentUser?.email || "");
  const [contactMessage, setContactMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [businessHours, setBusinessHoursState] = useState(null);
  const [policyContent, setPolicyContentState] = useState(null);
  const [storeDetails, setStoreDetailsState] = useState(null);

  useEffect(() => {
    getBusinessHours().then(setBusinessHoursState);
    getPolicyContent().then(setPolicyContentState);
    getStoreDetails().then(setStoreDetailsState);
  }, []);

  function field(key) {
    if (!policyContent) return t[key];
    const enKey = `${key}En`;
    if (lang === "en" && policyContent[enKey]) return policyContent[enKey];
    if (lang !== "en" && policyContent[key]) return policyContent[key];
    return t[key];
  }

  const storeAddress = storeDetails
    ? lang === "en" && storeDetails.addressEn
      ? storeDetails.addressEn
      : storeDetails.address || ""
    : "";

  const aboutStoreText = field("aboutStoreText").replace("{address}", storeAddress);

  const hoursText = businessHours
    ? businessHours.days
        .filter((d) => d.open)
        .map(
          (d) =>
            `${dict.manager.settings.dayNames[d.key]} ${d.openTime}\u2013${d.closeTime}`
        )
        .join(", ")
    : "";

  if (!show) return null;

  async function handleSubmitContact() {
    if (!contactMessage.trim()) return;

    setSubmitting(true);

    try {
      await submitContactMessage({
        name: contactName,
        email: contactEmail,
        message: contactMessage.trim(),
      });

      sendContactNotificationEmail({
        name: contactName,
        email: contactEmail,
        message: contactMessage.trim(),
      });

      setContactMessage("");
      alertDialog(t.contactSubmitSuccess);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className={commonStyles.pageTitle}>{t.title}</div>
      <div className={commonStyles.pageSub}>{t.subtitle}</div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>{t.aboutStoreTitle}</div>
        <div className={modalStyles.policyText}>
          {aboutStoreText}
        </div>
      </div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>{t.returnsTitle}</div>
        <div className={modalStyles.policyText}>
          {field("returnsText")}
        </div>
      </div>
      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>{t.cancellationTitle}</div>
        <div className={modalStyles.policyText}>
          {field("cancellationText")}
        </div>
      </div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>{t.shippingTitle}</div>
        <div className={modalStyles.policyText}>
          {field("shippingLine1")}
          <br />
          {field("shippingLine2")}
          <br />
          {field("shippingLine3")}
          <br />
          {field("shippingLine4")}
        </div>
      </div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>{t.privacyTitle}</div>
        <div className={modalStyles.policyText}>
          {field("privacyLine1")}
        </div>
      </div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>{t.contactTitle}</div>
        <div className={modalStyles.policyText} style={{ marginBottom: "1rem" }}>
          {storeDetails?.email && (
            <>
              {t.contactEmailPrefix} {storeDetails.email}
              <br />
            </>
          )}
          {field("contactPhone")}
          {hoursText && (
            <>
              <br />
              {t.hoursPrefix} {hoursText}
            </>
          )}
        </div>

        <div className={modalStyles.pdField} style={{ marginBottom: "0.7rem" }}>
          <label>{t.contactNameLabel}</label>
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>

        <div className={modalStyles.pdField} style={{ marginBottom: "0.7rem" }}>
          <label>{t.contactEmailLabel}</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>

        <div className={modalStyles.pdField} style={{ marginBottom: "0.9rem" }}>
          <label>{t.contactMessageLabel}</label>
          <textarea
            rows={4}
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder={t.contactMessagePlaceholder}
            style={{
              width: "100%",
              resize: "vertical",
              fontFamily: "inherit",
              padding: "0.6rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface2)",
              color: "var(--text)",
            }}
          />
        </div>

        <button
          type="button"
          className={`${commonStyles.btn} ${commonStyles.btnGold}`}
          onClick={handleSubmitContact}
          disabled={submitting || !contactMessage.trim()}
        >
          {t.contactSubmitButton}
        </button>
      </div>
    </div>
  );
}