import { useState } from "react";
import styles from "../../../styles/Manager.module.scss";

export default function SettingsView() {
  const [storeName, setStoreName] = useState("FashionSync");
  const [phone, setPhone] = useState("054-1234567");
  const [email, setEmail] = useState("store@fashionsync.co.il");
  const [address, setAddress] = useState("רחוב דיזנגוף 120, תל אביב");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`${styles.view} ${styles.active}`}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>הגדרות</h2>
          <p>פרטי חנות והגדרות מערכת</p>
        </div>
      </div>

      <div className={styles.g2}>
        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>פרטי חנות</div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.fg2}>
              <div className={styles.fg}>
                <div className={styles.fl}>שם החנות</div>
                <input className={styles.fi} value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              </div>

              <div className={styles.fg}>
                <div className={styles.fl}>טלפון</div>
                <input className={styles.fi} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className={styles.fg} style={{ gridColumn: "span 2" }}>
                <div className={styles.fl}>אימייל</div>
                <input className={styles.fi} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className={styles.fg} style={{ gridColumn: "span 2" }}>
                <div className={styles.fl}>כתובת</div>
                <input className={styles.fi} value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>

            <button
              className={`${styles.btn} ${styles.btnGold}`}
              style={{ marginTop: ".75rem" }}
              onClick={handleSave}
            >
              שמור שינויים
            </button>

            {saved && (
              <div className={`${styles.alert} ${styles.aSuccess}`} style={{ marginTop: ".75rem" }}>
                פרטים נשמרו ✓
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>הגדרות מערכת</div>
          </div>

          <div className={styles.cardBody}>
            <p style={{ color: "var(--muted)", fontSize: ".82rem", lineHeight: 1.5 }}>
              הגדרות מתקדמות זמינות בגרסה המלאה.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
