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

export default function SettingsView({
  onTranslateHistorical,
  translatingHistorical,
  historicalProgress,
}) {
  const { t: dict } = useLanguage();
  const t = dict.manager.settings;

  const [storeName, setStoreName] = useState("FashionSync");
  const [phone, setPhone] = useState("054-1234567");
  const [email, setEmail] = useState("store@fashionsync.co.il");
  const [address, setAddress] = useState("רחוב דיזנגוף 120, תל אביב");
  const [saved, setSaved] = useState(false);

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

  const handleSaveStore = () => {
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
            <div className={uiStyles.cardTitle}>
              {t.translationSectionTitle}
            </div>
          </div>

          <div className={uiStyles.cardBody}>
            <p
              style={{
                color: "var(--muted)",
                fontSize: "0.85rem",
                marginBottom: "0.9rem",
              }}
            >
              {t.translationSectionDesc}
            </p>

            <button
              type="button"
              onClick={onTranslateHistorical}
              disabled={translatingHistorical}
              style={{
                background: "transparent",
                border: "1px solid var(--gold)",
                color: "var(--gold)",
                borderRadius: "10px",
                padding: "0.6rem 1.2rem",
                fontFamily: "Alef, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: translatingHistorical ? "default" : "pointer",
              }}
            >
              {translatingHistorical
                ? t.translationSectionProgress
                    .replace("{done}", historicalProgress?.done ?? 0)
                    .replace("{total}", historicalProgress?.total ?? 0)
                : t.translationSectionButton}
            </button>
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
