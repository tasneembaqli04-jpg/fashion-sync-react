import { useEffect, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import formStyles from "../../../styles/manager/ManagerForms.module.scss";
import { useLanguage } from "../../../translations/LanguageProvider";
import {
  getBusinessHours,
  setBusinessHours,
  DEFAULT_DAYS,
} from "../../../services/settings/businessHoursService";
import {
  getPolicyContent,
  setPolicyContent,
  translatePolicyFields,
} from "../../../services/settings/policyContentService";
import {
  getStoreDetails,
  setStoreDetails,
  translateStoreAddress,
} from "../../../services/settings/storeDetailsService";

export default function SettingsView({
  onTranslateHistorical,
  translatingHistorical,
  historicalProgress,
}) {
  const { t: dict } = useLanguage();
  const t = dict.manager.settings;
  const policyDefaults = dict.customer.policy;

  const [storeName, setStoreName] = useState("FashionSync");
  const [phone, setPhone] = useState("054-1234567");
  const [email, setEmail] = useState("store@fashionsync.co.il");
  const [address, setAddress] = useState("רחוב דיזנגוף 120, תל אביב");
  const [addressEn, setAddressEn] = useState("");
  const [saved, setSaved] = useState(false);
  const [translatingAddress, setTranslatingAddress] = useState(false);

  useEffect(() => {
    getStoreDetails().then((details) => {
      if (!details) return;
      setStoreName(details.storeName || "FashionSync");
      setPhone(details.phone || "054-1234567");
      setEmail(details.email || "store@fashionsync.co.il");
      setAddress(details.address || "רחוב דיזנגוף 120, תל אביב");
      setAddressEn(details.addressEn || "");
    });
  }, []);

  async function handleTranslateAddress() {
    setTranslatingAddress(true);
    const translated = await translateStoreAddress(address);
    setAddressEn(translated);
    setTranslatingAddress(false);
  }

  const [policyReturns, setPolicyReturns] = useState(policyDefaults.returnsText);
  const [policyCancellation, setPolicyCancellation] = useState(policyDefaults.cancellationText);
  const [policyAboutStore, setPolicyAboutStore] = useState(
    policyDefaults.aboutStoreText.replace("{address}", address)
  );
  const [policyShipping1, setPolicyShipping1] = useState(policyDefaults.shippingLine1);
  const [policyShipping2, setPolicyShipping2] = useState(policyDefaults.shippingLine2);
  const [policyShipping3, setPolicyShipping3] = useState(policyDefaults.shippingLine3);
  const [policyShipping4, setPolicyShipping4] = useState(policyDefaults.shippingLine4);
  const [policyPrivacy, setPolicyPrivacy] = useState(policyDefaults.privacyLine1);
  const [policyPhone, setPolicyPhone] = useState(policyDefaults.contactPhone);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);
  const [translatingPolicy, setTranslatingPolicy] = useState(false);

  const [policyReturnsEn, setPolicyReturnsEn] = useState("");
  const [policyCancellationEn, setPolicyCancellationEn] = useState("");
  const [policyAboutStoreEn, setPolicyAboutStoreEn] = useState("");
  const [policyShipping1En, setPolicyShipping1En] = useState("");
  const [policyShipping2En, setPolicyShipping2En] = useState("");
  const [policyShipping3En, setPolicyShipping3En] = useState("");
  const [policyShipping4En, setPolicyShipping4En] = useState("");
  const [policyPrivacyEn, setPolicyPrivacyEn] = useState("");
  const [policyPhoneEn, setPolicyPhoneEn] = useState("");

  useEffect(() => {
    getPolicyContent().then((content) => {
      if (!content) return;
      setPolicyReturns(content.returnsText || policyDefaults.returnsText);
      setPolicyCancellation(content.cancellationText || policyDefaults.cancellationText);
      setPolicyAboutStore(
        (content.aboutStoreText || policyDefaults.aboutStoreText).replace(
          "{address}",
          address
        )
      );
      setPolicyShipping1(content.shippingLine1 || policyDefaults.shippingLine1);
      setPolicyShipping2(content.shippingLine2 || policyDefaults.shippingLine2);
      setPolicyShipping3(content.shippingLine3 || policyDefaults.shippingLine3);
      setPolicyShipping4(content.shippingLine4 || policyDefaults.shippingLine4);
      setPolicyPrivacy(content.privacyLine1 || policyDefaults.privacyLine1);
      setPolicyPhone(content.contactPhone || policyDefaults.contactPhone);

      setPolicyReturnsEn(content.returnsTextEn || "");
      setPolicyCancellationEn(content.cancellationTextEn || "");
      setPolicyAboutStoreEn(content.aboutStoreTextEn || "");
      setPolicyShipping1En(content.shippingLine1En || "");
      setPolicyShipping2En(content.shippingLine2En || "");
      setPolicyShipping3En(content.shippingLine3En || "");
      setPolicyShipping4En(content.shippingLine4En || "");
      setPolicyPrivacyEn(content.privacyLine1En || "");
      setPolicyPhoneEn(content.contactPhoneEn || "");
    });
    
  }, []);

  async function handleTranslatePolicy() {
    setTranslatingPolicy(true);


    const translations = await translatePolicyFields({
      returnsText: policyReturns,
      cancellationText: policyCancellation,
      aboutStoreText: policyAboutStore,
      shippingLine1: policyShipping1,
      shippingLine2: policyShipping2,
      shippingLine3: policyShipping3,
      shippingLine4: policyShipping4,
      privacyLine1: policyPrivacy,
      contactPhone: policyPhone,
    });

    const finalReturnsEn = translations.returnsTextEn;
    const finalCancellationEn = translations.cancellationTextEn;
    const finalAboutStoreEn = translations.aboutStoreTextEn;
    const finalShipping1En = translations.shippingLine1En;
    const finalShipping2En = translations.shippingLine2En;
    const finalShipping3En = translations.shippingLine3En;
    const finalShipping4En = translations.shippingLine4En;
    const finalPrivacyEn = translations.privacyLine1En;
    const finalPhoneEn = translations.contactPhoneEn;

    setPolicyReturnsEn(finalReturnsEn);
    setPolicyCancellationEn(finalCancellationEn);
    setPolicyAboutStoreEn(finalAboutStoreEn);
    setPolicyShipping1En(finalShipping1En);
    setPolicyShipping2En(finalShipping2En);
    setPolicyShipping3En(finalShipping3En);
    setPolicyShipping4En(finalShipping4En);
    setPolicyPrivacyEn(finalPrivacyEn);
    setPolicyPhoneEn(finalPhoneEn);

    await setPolicyContent({
      returnsText: policyReturns,
      returnsTextEn: finalReturnsEn,
      cancellationText: policyCancellation,
      cancellationTextEn: finalCancellationEn,
      aboutStoreText: policyAboutStore,
      aboutStoreTextEn: finalAboutStoreEn,
      shippingLine1: policyShipping1,
      shippingLine1En: finalShipping1En,
      shippingLine2: policyShipping2,
      shippingLine2En: finalShipping2En,
      shippingLine3: policyShipping3,
      shippingLine3En: finalShipping3En,
      shippingLine4: policyShipping4,
      shippingLine4En: finalShipping4En,
      privacyLine1: policyPrivacy,
      privacyLine1En: finalPrivacyEn,
      contactPhone: policyPhone,
      contactPhoneEn: finalPhoneEn,
    });

    setTranslatingPolicy(false);
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 2500);
  }


  const [days, setDays] = useState(DEFAULT_DAYS);
  const [hoursSaved, setHoursSaved] = useState(false);

  useEffect(() => {
    getBusinessHours().then((hours) => {
      setDays(hours.days);
    });
  }, []);

  function toggleDay(dayKey) {
    setDays((prev) =>
      prev.map((d) => (d.key === dayKey ? { ...d, open: !d.open } : d)),
    );
  }

  function updateDayTime(dayKey, field, value) {
    setDays((prev) =>
      prev.map((d) => (d.key === dayKey ? { ...d, [field]: value } : d)),
    );
  }

  async function handleSaveHours() {
    await setBusinessHours({ days });
    setHoursSaved(true);
    setTimeout(() => setHoursSaved(false), 2500);
  }
  const [notifLow, setNotifLow] = useState(true);
  const [notifOos, setNotifOos] = useState(true);
  const [notifDemand, setNotifDemand] = useState(true);
  const [demandThreshold, setDemandThreshold] = useState(15);
  const [notifSaved, setNotifSaved] = useState(false);

  const handleSaveStore = async () => {
    const finalAddressEn = await translateStoreAddress(address);
    setAddressEn(finalAddressEn);

    await setStoreDetails({ storeName, phone, email, address, addressEn: finalAddressEn });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveNotif = () => {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className={layoutStyles.g2}>
        <div className={uiStyles.card}>
          <div className={uiStyles.cardHd}>
            <div className={uiStyles.cardTitle}>{t.storeDetailsTitle}</div>
          </div>

          <div className={uiStyles.cardBody}>
            <div className={formStyles.fg2}>
              <div className={formStyles.fg}>
                <div className={formStyles.fl}>{t.storeName}</div>
                <input
                  className={formStyles.fi}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div className={formStyles.fg}>
                <div className={formStyles.fl}>{t.phone}</div>
                <input
                  className={formStyles.fi}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className={formStyles.fg} style={{ gridColumn: "span 2" }}>
                <div className={formStyles.fl}>{t.email}</div>
                <input
                  className={formStyles.fi}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={formStyles.fg} style={{ gridColumn: "span 2" }}>
                <div className={formStyles.fl}>{t.address}</div>
                <input
                  className={formStyles.fi}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className={formStyles.fg} style={{ gridColumn: "span 2" }}>
                <div className={formStyles.fl} style={{ marginBottom: "0.3rem" }}>
                  {t.addressEnLabel}
                </div>
                <input
                  className={formStyles.fi}
                  value={addressEn}
                  onChange={(e) => setAddressEn(e.target.value)}
                />
              </div>
            </div>

            <button
              className={`${uiStyles.btn} ${uiStyles.btnGold}`}
              style={{ marginTop: ".75rem" }}
              onClick={handleSaveStore}
            >
              {t.saveDetails}
            </button>

            {saved && (
              <div
                className={`${uiStyles.alert} ${uiStyles.aSuccess}`}
                style={{ marginTop: ".75rem" }}
              >
                {t.detailsSaved}
              </div>
            )}
          </div>
        </div>
        <div className={uiStyles.card}>
          <div className={uiStyles.cardHd}>
            <div className={uiStyles.cardTitle}>{t.hoursSectionTitle}</div>
          </div>

          <div className={uiStyles.cardBody}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
                marginBottom: "1rem",
              }}
            >
              {days.map((d) => (
                <div
                  key={d.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    flexWrap: "wrap",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    style={{
                      padding: "0.5rem 0.9rem",
                      borderRadius: "10px",
                      border: d.open
                        ? "1.5px solid var(--gold)"
                        : "1px solid var(--border)",
                      background: d.open ? "var(--gold-dim)" : "transparent",
                      color: d.open ? "var(--gold)" : "var(--muted)",
                      fontFamily: "Alef, sans-serif",
                      fontWeight: d.open ? 700 : 400,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      minWidth: "60px",
                    }}
                  >
                    {t.dayNames[d.key]}
                  </button>

                  {d.open ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.6rem",
                        alignItems: "center",
                      }}
                    >
                      <input
                        className={formStyles.fi}
                        type="text"
                        inputMode="numeric"
                        placeholder="09:00"
                        maxLength={5}
                        value={d.openTime || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (/^[0-9:]*$/.test(value)) {
                            updateDayTime(d.key, "openTime", value);
                          }
                        }}
                        style={{
                          width: "145px",
                          direction: "ltr",
                          textAlign: "center",
                          cursor: "text",
                        }}
                      />

                      <span style={{ color: "var(--muted)" }}>–</span>

                      <input
                        className={formStyles.fi}
                        type="text"
                        inputMode="numeric"
                        placeholder="18:00"
                        maxLength={5}
                        value={d.closeTime || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (/^[0-9:]*$/.test(value)) {
                            updateDayTime(d.key, "closeTime", value);
                          }
                        }}
                        style={{
                          width: "145px",
                          direction: "ltr",
                          textAlign: "center",
                          cursor: "text",
                        }}
                      />
                    </div>
                  ) : (
                    <span
                      style={{ color: "var(--muted)", fontSize: "0.85rem" }}
                    >
                      {t.dayClosed}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveHours}
              style={{
                background:
                  "linear-gradient(135deg, var(--gold), var(--gold-light))",
                color: "#080808",
                border: "none",
                borderRadius: "10px",
                padding: "0.6rem 1.2rem",
                fontFamily: "Alef, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t.saveHoursButton}
            </button>

            {hoursSaved && (
              <div
                className={`${uiStyles.alert} ${uiStyles.aSuccess}`}
                style={{ marginTop: "0.75rem" }}
              >
                {t.hoursSaved}
              </div>
            )}
          </div>
        </div>

        <div className={uiStyles.card}>
          <div className={uiStyles.cardHd}>
            <div className={uiStyles.cardTitle}>{t.policySectionTitle}</div>
          </div>

          <div className={uiStyles.cardBody}>
            <div className={formStyles.fg} style={{ marginBottom: "0.9rem" }}>
              <div className={formStyles.fl}>{t.policyAboutStoreLabel}</div>
              <textarea
                className={formStyles.fi}
                rows={2}
                value={policyAboutStore}
                onChange={(e) => setPolicyAboutStore(e.target.value)}
                style={{ width: "100%", resize: "vertical", fontFamily: "Alef, sans-serif" }}
              />
            </div>

            <div className={formStyles.fg} style={{ marginBottom: "0.9rem" }}>
              <div className={formStyles.fl}>{t.policyReturnsLabel}</div>
              <textarea
                className={formStyles.fi}
                rows={3}
                value={policyReturns}
                onChange={(e) => setPolicyReturns(e.target.value)}
                style={{ width: "100%", resize: "vertical", fontFamily: "Alef, sans-serif" }}
              />
            </div>

            <div className={formStyles.fg} style={{ marginBottom: "0.9rem" }}>
              <div className={formStyles.fl}>{t.policyCancellationLabel}</div>
              <textarea
                className={formStyles.fi}
                rows={3}
                value={policyCancellation}
                onChange={(e) => setPolicyCancellation(e.target.value)}
                style={{ width: "100%", resize: "vertical", fontFamily: "Alef, sans-serif" }}
              />
            </div>

            <div className={formStyles.fg} style={{ marginBottom: "0.5rem" }}>
              <div className={formStyles.fl}>{t.policyShippingLabel}</div>
            </div>
            <input
              className={formStyles.fi}
              value={policyShipping1}
              onChange={(e) => setPolicyShipping1(e.target.value)}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              className={formStyles.fi}
              value={policyShipping2}
              onChange={(e) => setPolicyShipping2(e.target.value)}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              className={formStyles.fi}
              value={policyShipping3}
              onChange={(e) => setPolicyShipping3(e.target.value)}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              className={formStyles.fi}
              value={policyShipping4}
              onChange={(e) => setPolicyShipping4(e.target.value)}
              style={{ width: "100%", marginBottom: "0.9rem" }}
            />

            <div className={formStyles.fg} style={{ marginBottom: "0.9rem" }}>
              <div className={formStyles.fl}>{t.policyPrivacyLabel}</div>
              <textarea
                className={formStyles.fi}
                rows={2}
                value={policyPrivacy}
                onChange={(e) => setPolicyPrivacy(e.target.value)}
                style={{ width: "100%", resize: "vertical", fontFamily: "Alef, sans-serif" }}
              />
            </div>

            <div className={formStyles.fg} style={{ marginBottom: "0.9rem" }}>
              <div className={formStyles.fl}>{t.policyPhoneLabel}</div>
              <input
                className={formStyles.fi}
                value={policyPhone}
                onChange={(e) => setPolicyPhone(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ color: "var(--gold)", fontSize: "0.85rem", fontWeight: 700, marginTop: "0.5rem", marginBottom: "0.9rem" }}>
              {t.policyEnglishTitle}
            </div>

            <div className={formStyles.fg} style={{ marginBottom: "0.9rem" }}>
              <div className={formStyles.fl}>{t.policyAboutStoreLabel} (EN)</div>
              <textarea
                className={formStyles.fi}
                rows={2}
                value={policyAboutStoreEn}
                onChange={(e) => setPolicyAboutStoreEn(e.target.value)}
                style={{ width: "100%", resize: "vertical", fontFamily: "Alef, sans-serif" }}
              />
            </div>

            <div className={formStyles.fg} style={{ marginBottom: "0.9rem" }}>
              <div className={formStyles.fl}>{t.policyReturnsLabel} (EN)</div>
              <textarea
                className={formStyles.fi}
                rows={3}
                value={policyReturnsEn}
                onChange={(e) => setPolicyReturnsEn(e.target.value)}
                style={{ width: "100%", resize: "vertical", fontFamily: "Alef, sans-serif" }}
              />
            </div>

            <div className={formStyles.fg} style={{ marginBottom: "0.9rem" }}>
              <div className={formStyles.fl}>{t.policyCancellationLabel} (EN)</div>
              <textarea
                className={formStyles.fi}
                rows={3}
                value={policyCancellationEn}
                onChange={(e) => setPolicyCancellationEn(e.target.value)}
                style={{ width: "100%", resize: "vertical", fontFamily: "Alef, sans-serif" }}
              />
            </div>

            <div className={formStyles.fg} style={{ marginBottom: "0.5rem" }}>
              <div className={formStyles.fl}>{t.policyShippingLabel} (EN)</div>
            </div>
            <input
              className={formStyles.fi}
              value={policyShipping1En}
              onChange={(e) => setPolicyShipping1En(e.target.value)}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              className={formStyles.fi}
              value={policyShipping2En}
              onChange={(e) => setPolicyShipping2En(e.target.value)}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              className={formStyles.fi}
              value={policyShipping3En}
              onChange={(e) => setPolicyShipping3En(e.target.value)}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              className={formStyles.fi}
              value={policyShipping4En}
              onChange={(e) => setPolicyShipping4En(e.target.value)}
              style={{ width: "100%", marginBottom: "0.9rem" }}
            />

            <div className={formStyles.fg} style={{ marginBottom: "0.9rem" }}>
              <div className={formStyles.fl}>{t.policyPrivacyLabel} (EN)</div>
              <textarea
                className={formStyles.fi}
                rows={2}
                value={policyPrivacyEn}
                onChange={(e) => setPolicyPrivacyEn(e.target.value)}
                style={{ width: "100%", resize: "vertical", fontFamily: "Alef, sans-serif" }}
              />
            </div>

            <div className={formStyles.fg} style={{ marginBottom: "0.9rem" }}>
              <div className={formStyles.fl}>{t.policyPhoneLabel} (EN)</div>
              <input
                className={formStyles.fi}
                value={policyPhoneEn}
                onChange={(e) => setPolicyPhoneEn(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <button
              type="button"
              onClick={handleTranslatePolicy}
              disabled={translatingPolicy}
              style={{
                background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
                color: "#080808",
                border: "none",
                borderRadius: "10px",
                padding: "0.6rem 1.2rem",
                fontFamily: "Alef, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {translatingPolicy ? t.policySavingButton : t.policySaveButton}
            </button>

            {policySaved && (
              <div
                className={`${uiStyles.alert} ${uiStyles.aSuccess}`}
                style={{ marginTop: "0.75rem" }}
              >
                {t.policySaved}
              </div>
            )}
          </div>
        </div>

        <div className={uiStyles.card}>
          <div className={uiStyles.cardHd}>
            <div className={uiStyles.cardTitle}>
              {t.notificationSettingsTitle}
            </div>
          </div>

          <div className={uiStyles.cardBody}>
            {[
              {
                label: t.lowStockLabel,
                desc: t.lowStockDesc,
                val: notifLow,
                set: setNotifLow,
              },
              {
                label: t.outOfStockLabel,
                desc: t.outOfStockDesc,
                val: notifOos,
                set: setNotifOos,
              },
              {
                label: t.highDemandLabel,
                desc: t.highDemandDesc,
                val: notifDemand,
                set: setNotifDemand,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid var(--border)",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.86rem", fontWeight: 700 }}>
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--muted)",
                      marginTop: "0.12rem",
                    }}
                  >
                    {item.desc}
                  </div>
                </div>

                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "42px",
                    height: "22px",
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.val}
                    onChange={() => item.set((p) => !p)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      inset: 0,
                      background: item.val
                        ? "var(--gold-dim)"
                        : "rgba(255,255,255,0.1)",
                      border: item.val
                        ? "1px solid var(--gold)"
                        : "1px solid var(--border)",
                      borderRadius: "22px",
                      transition: "0.3s",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        height: "16px",
                        width: "16px",
                        right: item.val ? "3px" : "23px",
                        bottom: "2px",
                        background: item.val ? "var(--gold)" : "var(--muted)",
                        borderRadius: "50%",
                        transition: "0.3s",
                      }}
                    />
                  </span>
                </label>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 0",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.86rem", fontWeight: 700 }}>
                  {t.demandThresholdLabel}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--muted)",
                    marginTop: "0.12rem",
                  }}
                >
                  {t.demandThresholdDesc}
                </div>
              </div>

              <input
                type="number"
                className={formStyles.fi}
                value={demandThreshold}
                onChange={(e) => setDemandThreshold(e.target.value)}
                style={{
                  width: "80px",
                  textAlign: "center",
                  padding: "0.45rem 0.6rem",
                }}
              />
            </div>

            <button
              className={`${uiStyles.btn} ${uiStyles.btnGold}`}
              style={{ marginTop: ".75rem" }}
              onClick={handleSaveNotif}
            >
              {t.saveSettings}
            </button>

            {notifSaved && (
              <div
                className={`${uiStyles.alert} ${uiStyles.aSuccess}`}
                style={{ marginTop: ".75rem" }}
              >
                {t.settingsSaved}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}