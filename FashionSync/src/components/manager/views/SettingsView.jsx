import { useState } from "react";
import styles from "../../../styles/Manager.module.scss";

const INITIAL_EMPLOYEES = [
  { id: "E1", name: "דנה לוי", username: "employee1", role: "מוכרת", active: true },
  { id: "E2", name: "רון מזרחי", username: "employee2", role: "מוכר", active: true },
];

export default function SettingsView() {
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

  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [empName, setEmpName] = useState("");
  const [empUser, setEmpUser] = useState("");
  const [empPass, setEmpPass] = useState("");
  const [empRole, setEmpRole] = useState("");
  const [empErr, setEmpErr] = useState(false);

  const handleSaveStore = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveNotif = () => {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  const handleAddEmployee = () => {
    if (!empName.trim() || !empUser.trim() || !empPass.trim() || !empRole.trim()) {
      setEmpErr(true);
      setTimeout(() => setEmpErr(false), 2500);
      return;
    }
    setEmployees((prev) => [...prev, { id: `E${Date.now()}`, name: empName.trim(), username: empUser.trim(), role: empRole.trim(), active: true }]);
    setEmpName(""); setEmpUser(""); setEmpPass(""); setEmpRole("");
    setShowAddEmp(false);
  };

  const handleToggleEmp = (id) => {
    setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, active: !e.active } : e));
  };

  const handleRemoveEmp = (id) => {
    if (!window.confirm("למחוק עובד?")) return;
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className={`${styles.view} ${styles.active}`}>
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
            <button className={`${styles.btn} ${styles.btnGold}`} style={{ marginTop: ".75rem" }} onClick={handleSaveStore}>
              💾 שמור פרטים
            </button>
            {saved && <div className={`${styles.alert} ${styles.aSuccess}`} style={{ marginTop: ".75rem" }}>✅ פרטים נשמרו</div>}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div className={styles.cardTitle}>🔔 הגדרות התראות</div>
          </div>
          <div className={styles.cardBody}>
            {[
              { label: "התראות מלאי נמוך", desc: "קבל התראה כשמוצר מתחת לרף המינימום", val: notifLow, set: setNotifLow },
              { label: "התראות מלאי אפס", desc: "קבל התראה כשמוצר אוזל לחלוטין", val: notifOos, set: setNotifOos },
              { label: "התראות ביקושים גבוהים", desc: "כאשר notifyCount עולה על 15", val: notifDemand, set: setNotifDemand },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border)", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.86rem", fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.12rem" }}>{item.desc}</div>
                </div>
                <label style={{ position: "relative", display: "inline-block", width: "42px", height: "22px", flexShrink: 0 }}>
                  <input type="checkbox" checked={item.val} onChange={() => item.set((p) => !p)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{
                    position: "absolute", cursor: "pointer", inset: 0,
                    background: item.val ? "var(--gold-dim)" : "rgba(255,255,255,0.1)",
                    border: item.val ? "1px solid var(--gold)" : "1px solid var(--border)",
                    borderRadius: "22px", transition: "0.3s",
                  }}>
                    <span style={{
                      position: "absolute", height: "16px", width: "16px",
                      right: item.val ? "3px" : "23px", bottom: "2px",
                      background: item.val ? "var(--gold)" : "var(--muted)",
                      borderRadius: "50%", transition: "0.3s",
                    }} />
                  </span>
                </label>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.86rem", fontWeight: 700 }}>סף ביקושים לאזהרה</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.12rem" }}>כמות בקשות מינימלית להתראה</div>
              </div>
              <input type="number" className={styles.fi} value={demandThreshold} onChange={(e) => setDemandThreshold(e.target.value)}
                style={{ width: "80px", textAlign: "center", padding: "0.45rem 0.6rem" }} />
            </div>
            <button className={`${styles.btn} ${styles.btnGold}`} style={{ marginTop: ".75rem" }} onClick={handleSaveNotif}>
              💾 שמור הגדרות
            </button>
            {notifSaved && <div className={`${styles.alert} ${styles.aSuccess}`} style={{ marginTop: ".75rem" }}>✅ הגדרות נשמרו</div>}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>👥 ניהול עובדים</div>
          <button className={`${styles.btn} ${styles.btnGold}`} style={{ fontSize: ".78rem", padding: ".4rem .85rem" }} onClick={() => setShowAddEmp((p) => !p)}>
            + הוסף עובד
          </button>
        </div>
        <div className={styles.cardBody}>
          {showAddEmp && (
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border-gold)", borderRadius: "12px", padding: "1.1rem", marginBottom: "1rem" }}>
              <div className={styles.fg2}>
                <div className={styles.fg}>
                  <div className={styles.fl}>שם מלא</div>
                  <input className={styles.fi} placeholder="שם העובד" value={empName} onChange={(e) => setEmpName(e.target.value)} />
                </div>
                <div className={styles.fg}>
                  <div className={styles.fl}>שם משתמש</div>
                  <input className={styles.fi} placeholder="username" value={empUser} onChange={(e) => setEmpUser(e.target.value)} />
                </div>
                <div className={styles.fg}>
                  <div className={styles.fl}>סיסמה</div>
                  <input className={styles.fi} type="password" placeholder="סיסמה" value={empPass} onChange={(e) => setEmpPass(e.target.value)} />
                </div>
                <div className={styles.fg}>
                  <div className={styles.fl}>תפקיד</div>
                  <input className={styles.fi} placeholder="לדוגמה: מוכר/ת" value={empRole} onChange={(e) => setEmpRole(e.target.value)} />
                </div>
              </div>
              {empErr && <div className={`${styles.alert} ${styles.aDanger}`} style={{ marginBottom: ".55rem" }}>❌ יש למלא את כל השדות</div>}
              <div style={{ display: "flex", gap: ".55rem", marginTop: ".55rem" }}>
                <button className={`${styles.btn} ${styles.btnGold}`} onClick={handleAddEmployee}>הוסף עובד</button>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowAddEmp(false)}>ביטול</button>
              </div>
            </div>
          )}

          {employees.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: ".84rem", textAlign: "center", padding: "1rem" }}>אין עובדים</div>
          ) : (
            employees.map((emp) => (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.82rem 1rem", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "11px", marginBottom: "0.55rem", gap: "0.75rem" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--gold-dim)", border: "2px solid var(--border-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{emp.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.06rem" }}>
                    {emp.role} · @{emp.username} ·{" "}
                    <span style={{ color: emp.active ? "var(--green)" : "var(--red)" }}>{emp.active ? "פעיל" : "לא פעיל"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: ".72rem", padding: ".3rem .65rem" }} onClick={() => handleToggleEmp(emp.id)}>
                    {emp.active ? "השבת" : "הפעל"}
                  </button>
                  <button className={styles.btn} style={{ background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", color: "#f1948a", fontSize: ".72rem", padding: ".3rem .65rem" }} onClick={() => handleRemoveEmp(emp.id)}>
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}