import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { signInAsManager } from "../../backend/services/auth/firebaseAuth";
import loginStyles from "../../styles/manager/ManagerLogin.module.scss";
import formStyles from "../../styles/manager/ManagerForms.module.scss";

export default function LoginOverlay({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorVisible, setErrorVisible] = useState(false);

  const handleLogin = async () => {
    if (username.trim() === "manager" && password === "admin123") {
      setErrorVisible(false);
      await signInAsManager();
      onLoginSuccess();
      return;
    }

    setErrorVisible(true);
    setTimeout(() => setErrorVisible(false), 2000);
  };

  return (
    <div className={loginStyles.loginOverlay}>
      <div className={loginStyles.loginBox}>
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

        <div className={loginStyles.loginBrand}>FashionSync</div>
        <div className={loginStyles.loginSub}>👑 כניסת מנהל ראשי</div>

        <div className={formStyles.fg}>
          <div className={formStyles.fl}>שם משתמש</div>
          <input
            className={formStyles.fi}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div className={formStyles.fg}>
          <div className={formStyles.fl}>סיסמה</div>
          <input
            className={formStyles.fi}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {errorVisible && (
          <div className={loginStyles.errMsg}>❌ שם משתמש או סיסמה שגויים</div>
        )}

        <button className={loginStyles.btnLogin} onClick={handleLogin}>
          כניסה
        </button>
      </div>
    </div>
  );
}