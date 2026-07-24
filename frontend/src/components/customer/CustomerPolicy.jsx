import { useState } from "react";
import commonStyles from "../../styles/customer/Customer.module.scss";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";
import { useDialog } from "../common/DialogProvider";
import { submitContactMessage } from "../../services/contact/contactMessagesService";
import { sendContactNotificationEmail } from "../../services/email/emailService";

export default function CustomerPolicy({ show, currentUser }) {
  const { t: dict } = useLanguage();
  const t = dict.customer.policy;
  const { alertDialog } = useDialog();

  const [contactName, setContactName] = useState(currentUser?.name || "");
  const [contactEmail, setContactEmail] = useState(currentUser?.email || "");
  const [contactMessage, setContactMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        </div>
      </div>

      <div className={modalStyles.policySection}>
        <div className={modalStyles.policyTitle}>{t.contactTitle}</div>
        <div className={modalStyles.policyText} style={{ marginBottom: "1rem" }}>
          {t.contactPhone}
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