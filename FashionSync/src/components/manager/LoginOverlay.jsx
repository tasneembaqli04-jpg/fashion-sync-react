import { useState } from "react";
import styles from "../../styles/Manager.module.scss";

export default function LoginOverlay({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);

  const submitLogin = () => {
    const result = onLogin({ username, password });

    if (!result.success) {
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
    }
  };

  return (
    <div className={styles.loginOverlay}>
      <div className={styles.loginBox}>
        <div className={styles.loginBrand}>FashionSync</div>
        <div className={styles.loginSub}>👑 כניסת מנהל ראשי</div>

        <div className={styles.fg}>
          <div className={styles.fl}>שם משתמש</div>
          <input
            className={styles.fi}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitLogin()}
          />
        </div>

        <div className={styles.fg}>
          <div className={styles.fl}>סיסמה</div>
          <input
            className={styles.fi}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitLogin()}
          />
        </div>

        <div
          className={styles.errMsg}
          style={{ display: showError ? "block" : "none" }}
        >
          ❌ שם משתמש או סיסמה שגויים
        </div>

        <button className={styles.btnLogin} onClick={submitLogin}>
          כניסה
        </button>
      </div>
    </div>
  );
}