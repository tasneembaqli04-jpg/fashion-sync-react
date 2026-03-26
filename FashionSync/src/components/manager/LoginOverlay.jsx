import { useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "../../styles/Manager.module.scss";

export default function LoginOverlay({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorVisible, setErrorVisible] = useState(false);

  const handleLogin = () => {
    if (username.trim() === "manager" && password === "admin123") {
      setErrorVisible(false);
      onLoginSuccess();
      return;
    }

    setErrorVisible(true);
    setTimeout(() => setErrorVisible(false), 2000);
  };

  return (
    <div className={styles.loginOverlay}>
      <div className={styles.loginBox}>
        <button
          onClick={() => navigate("/")}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: "1.2rem",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        <div className={styles.loginBrand}>FashionSync</div>
        <div className={styles.loginSub}>👑 כניסת מנהל ראשי</div>

        <div className={styles.fg}>
          <div className={styles.fl}>שם משתמש</div>
          <input
            className={styles.fi}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div className={styles.fg}>
          <div className={styles.fl}>סיסמה</div>
          <input
            className={styles.fi}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {errorVisible && (
          <div className={styles.errMsg}>❌ שם משתמש או סיסמה שגויים</div>
        )}

        <button className={styles.btnLogin} onClick={handleLogin}>
          כניסה
        </button>
      </div>
    </div>
  );
}
