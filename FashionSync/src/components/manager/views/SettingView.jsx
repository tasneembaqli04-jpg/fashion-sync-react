import styles from "../../../styles/Manager.module.scss";

export default function SettingsView({ onOpenAddEmployee }) {
  return (
    <div className={styles.view}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>⚙️ הגדרות מערכת</h2>
          <p>ניהול חנות, עובדים, קטגוריות ועוד</p>
        </div>
      </div>

      <div className={styles.g2}>
        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>🏪 פרטי החנות</div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.settingsSection}>
              <div className={styles.fg2}>
                <div className={styles.fg}>
                  <div className={styles.fl}>שם החנות</div>
                  <input className={styles.fi} defaultValue="FashionSync" />
                </div>

                <div className={styles.fg}>
                  <div className={styles.fl}>טלפון</div>
                  <input className={styles.fi} defaultValue="054-1234567" />
                </div>

                <div className={styles.fg} style={{ gridColumn: "span 2" }}>
                  <div className={styles.fl}>אימייל</div>
                  <input className={styles.fi} defaultValue="store@fashionsync.co.il" />
                </div>

                <div className={styles.fg} style={{ gridColumn: "span 2" }}>
                  <div className={styles.fl}>כתובת</div>
                  <input className={styles.fi} defaultValue="רחוב דיזנגוף 120, תל אביב" />
                </div>
              </div>

              <button className={styles.btnGold} style={{ marginTop: "0.75rem" }}>
                💾 שמור פרטים
              </button>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>🔔 הגדרות התראות</div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.settingsSection}>
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>התראות מלאי נמוך</div>
                  <div className={styles.settingDesc}>
                    קבל התראה כשמוצר מתחת לרף המינימום
                  </div>
                </div>
                <div className={styles.toggleWrap}>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>התראות מלאי אפס</div>
                  <div className={styles.settingDesc}>
                    קבל התראה כשמוצר אוזל לחלוטין
                  </div>
                </div>
                <div className={styles.toggleWrap}>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>התראות ביקושים גבוהים</div>
                  <div className={styles.settingDesc}>כאשר notifyCount עולה על 15</div>
                </div>
                <div className={styles.toggleWrap}>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>סף ביקושים לאזהרה</div>
                  <div className={styles.settingDesc}>כמות בקשות מינימלית להתראה</div>
                </div>
                <div>
                  <input
                    type="number"
                    className={styles.fi}
                    defaultValue="15"
                    style={{ width: "80px", textAlign: "center", padding: "0.45rem 0.6rem" }}
                  />
                </div>
              </div>

              <button className={styles.btnGold} style={{ marginTop: "0.75rem" }}>
                💾 שמור הגדרות
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>👥 ניהול עובדים</div>
          <button
            className={styles.btnGold}
            style={{ fontSize: "0.78rem", padding: "0.4rem 0.85rem" }}
            onClick={onOpenAddEmployee}
          >
            + הוסף עובד
          </button>
        </div>

        <div className={styles.cardBody}></div>
      </div>
    </div>
  );
}