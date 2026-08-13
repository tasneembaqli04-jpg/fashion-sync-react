import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import FloatingItems from "../home/FloatingItems";
import { signIn } from "../../services/auth/firebaseAuth";
import loginStyles from "../../styles/manager/ManagerLogin.module.scss";
import formStyles from "../../styles/manager/ManagerForms.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";
import homeStyles from "../../styles/Home.module.scss";
import HomeBackground from "../home/HomeBackground";
import HomeNavbar from "../home/HomeNavbar";
import { loadFeaturedImage } from "../../functions/home/featuredProduct.js";
import HomeHero from "../home/HomeHero";

// שם המשתמש שמוקלד בטופס. אינו כתובת מייל, אלא כינוי נוח לכניסה.
const MANAGER_USERNAME = "manager";

// כתובת המייל של חשבון המנהלת ב-Firebase Auth.
//
// הכתובת אינה סוד ולכן מותר שתישאר בקוד: כתובת מייל לבדה אינה מעניקה
// גישה לשום דבר, והיא מופיעה ממילא גם ב-firestore.rules וב-Manager.jsx.
//
// מה שכן סוד הוא הסיסמה — והיא איננה בקובץ הזה. בעבר היא הייתה כתובה
// כאן, ולכן נשלחה בקוד המקור לכל מי שטען את האתר. כעת המנהלת מקלידה
// אותה בטופס, והיא לעולם לא נכללת בחבילת הבנייה.
const MANAGER_EMAIL = "manager@fashionsync-internal.com";

export default function LoginOverlay({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { t: dict } = useLanguage();
  const t = dict.manager.loginOverlay;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [featuredImage, setFeaturedImage] = useState("");

  useEffect(() => {
    loadFeaturedImage().then(setFeaturedImage);
  }, []);

  const handleLogin = async () => {
    // הודעת שגיאה אחת לכל סוגי הכשל, כדי לא לרמוז אם שם המשתמש נכון
    // והסיסמה שגויה או להפך.
    const showError = () => {
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 2000);
    };

    const isManagerUsername =
      username.trim().toLowerCase() === MANAGER_USERNAME;

    if (!isManagerUsername || !password) {
      showError();
      return;
    }

    setErrorVisible(false);

    // הסיסמה מגיעה מהשדה שהמנהלת הקלידה, ולא מהקוד.
    // Firebase הוא זה שמאמת אותה, ולא השוואת מחרוזות בדפדפן.
    const result = await signIn(MANAGER_EMAIL, password, {});

    if (result.user) {
      onLoginSuccess();
      return;
    }

    showError();
  };

  return (
    <div className={loginStyles.loginOverlay}>
      <div className={loginStyles.bgLayer}>
        <div className={homeStyles.homePage}>
          <HomeBackground featuredImage={featuredImage} />
          <FloatingItems />
          <HomeNavbar isLight={false} onToggleTheme={() => {}} />
          <HomeHero onOpenLogin={() => {}} onBrowse={() => {}} />
        </div>
      </div>

      <div className={loginStyles.blurLayer} />

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
        <div className={loginStyles.loginSub}>{t.title}</div>

        <div className={formStyles.fg}>
          <div className={loginStyles.loginLabel}>{t.username}</div>
          <input
            className={`${formStyles.fi} ${loginStyles.loginInput}`}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div className={formStyles.fg}>
          <div className={loginStyles.loginLabel}>{t.password}</div>
          <div style={{ position: "relative" }}>
            <input
              className={`${formStyles.fi} ${loginStyles.loginInput}`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ paddingInlineEnd: "2.6rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              style={{
                position: "absolute",
                insetInlineEnd: "0.6rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                color: "var(--muted, #888)",
                padding: "0.2rem",
                lineHeight: 1,
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {errorVisible && (
          <div className={loginStyles.errMsg}>{t.wrongCredentials}</div>
        )}

        <button className={loginStyles.btnLogin} onClick={handleLogin}>
          {t.loginButton}
        </button>
      </div>
    </div>
  );
}