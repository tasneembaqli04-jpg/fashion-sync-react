import { useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import formStyles from "../../../styles/manager/ManagerForms.module.scss";
import { useLanguage } from "../../../translations/LanguageProvider";

export default function SettingsView() {
  const { t: dict } = useLanguage();
  const t = dict.manager.settings;

  const [storeName, setStoreName] = useState("FashionSync");
  const [phone, setPhone] = useState("054-1234567");
  const [email, setEmail] = useState("store@fashionsync.co.il");
  const [address, setAddress] = useState("רחוב דיזנגוף 120, תל אביב");
  const [saved, setSaved] = useState(false);

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
            <div className={uiStyles.cardTitle}>{t.notificationSettingsTitle}</div>
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
                style={{ width: "80px", textAlign: "center", padding: "0.45rem 0.6rem" }}
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