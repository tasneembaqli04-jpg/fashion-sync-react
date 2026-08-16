import { useEffect, useState } from "react";
import { withPolicyNumbers } from "../../data/storePolicy";
import commonStyles from "../../styles/customer/Customer.module.scss";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";
import { useDialog } from "../common/DialogProvider";
import { submitContactMessage } from "../../services/contact/contactMessagesService";
import { sendContactNotificationEmail } from "../../services/email/emailService";
import { getBusinessHours } from "../../services/settings/businessHoursService";
import { getPolicyContent } from "../../services/settings/policyContentService";
import { getStoreDetails } from "../../services/settings/storeDetailsService";

/**
 * How a field filled in from the account looks: still legible, visibly not
 * an invitation to type.
 */
const accountFieldStyle = {
  background: "rgba(255, 255, 255, 0.03)",
  cursor: "default",
};

export default function CustomerPolicy({ show, currentUser }) {
  const { t: dict, lang } = useLanguage();
  const t = dict.customer.policy;
  const { alertDialog } = useDialog();

  // A signed-in customer's details are read from her account rather than held
  // in state. They used to be state seeded from `currentUser`, which captured
  // whatever was known when the page first rendered: signing in afterwards
  // left the fields on the guest's empty values, and the enquiry arrived with
  // no address to answer.
  //
  // Guests still type their own, so their answers keep their own state.
  const isSignedIn = Boolean(currentUser?.email);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const contactName = isSignedIn ? currentUser.name || "" : guestName;
  const contactEmail = isSignedIn ? currentUser.email : guestEmail;
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

  // The rule numbers are filled in from the constants the logic uses, so the
  // published policy cannot describe a window or a threshold the system no
  // longer applies. Manager-edited text goes through the same substitution.
  function field(key) {
    return withPolicyNumbers(rawField(key));
  }

  function rawField(key) {
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
          {field("shippingLine4").replace("{address}", storeAddress)}
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
          {/*
            Phone, email and address all come from the store settings, so the
            manager's entry is what the customer sees. A detail she has not
            filled in is left out rather than replaced with a placeholder.
          */}
          {storeDetails?.phone && (
            <>
              {t.contactPhonePrefix} {storeDetails.phone}
            </>
          )}
          {hoursText && (
            <>
              <br />
              {t.hoursPrefix} {hoursText}
            </>
          )}
        </div>

        <div className={modalStyles.pdField} style={{ marginBottom: "0.7rem" }}>
          <label htmlFor="contact-name">{t.contactNameLabel}</label>
          <input
            id="contact-name"
            type="text"
            value={contactName}
            onChange={(e) => setGuestName(e.target.value)}
            readOnly={isSignedIn}
            style={isSignedIn ? accountFieldStyle : undefined}
          />
        </div>

        <div className={modalStyles.pdField} style={{ marginBottom: "0.7rem" }}>
          <label htmlFor="contact-email">{t.contactEmailLabel}</label>
          {/*
            readOnly rather than disabled: a disabled field is skipped by the
            keyboard and read out as unavailable, when the value is not
            unavailable at all — it is settled. Read-only keeps it reachable
            and announced.
          */}
          <input
            id="contact-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            readOnly={isSignedIn}
            aria-describedby={isSignedIn ? "contact-email-note" : undefined}
            style={isSignedIn ? accountFieldStyle : undefined}
          />
          {isSignedIn && (
            <div
              id="contact-email-note"
              style={{
                fontSize: "0.78rem",
                color: "var(--muted)",
                marginTop: "0.3rem",
              }}
            >
              {t.contactEmailFromAccount}
            </div>
          )}
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