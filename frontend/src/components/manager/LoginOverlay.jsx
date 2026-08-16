import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { signIn } from "../../services/auth/firebaseAuth";
import { auth } from "../../firebase";
import { setPersistence, browserSessionPersistence } from "firebase/auth";
import loginStyles from "../../styles/manager/ManagerLogin.module.scss";
import formStyles from "../../styles/manager/ManagerForms.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";
import homeStyles from "../../styles/Home.module.scss";
import HomeBackground from "../home/HomeBackground";
import HomeNavbar from "../home/HomeNavbar";
import { loadFeaturedImage } from "../../functions/home/featuredProduct.js";
import HomeHero from "../home/HomeHero";

// Username typed into the form. Not an email address, just a convenient alias.
const MANAGER_USERNAME = "manager";

// Email address of the manager account in Firebase Auth.
//
// The address is not a secret and may stay in the source: an email address on
// its own grants nothing.
//
// It appears in three places that have to agree — here, the gate in
// Manager.jsx, and isManager() in firestore.rules — and the rules file cannot
// import from the application, so the three are kept in step by hand. Changing
// it in fewer than all three locks the manager out: the rules alone decide
// whether anything can be read or written.
//
// The password is the secret, and it is deliberately not in this file. The
// manager types it into the form, so it never reaches the build output and is
// never shipped to a visitor's browser.
const MANAGER_EMAIL = "fashionsyncmanager@gmail.com";

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
    // A single error message for every failure mode, so it never hints
    // whether the username was right and only the password was wrong.
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

    // Keep the management session to this browser session only, so closing the
    // browser signs the manager out and the password is required again.
    //
    // This is set here rather than on the shared auth instance in firebase.js
    // on purpose: persistence applies per sign-in call, so scoping it to the
    // management login leaves the customer session on the default persistence,
    // which survives a browser restart as it always has.
    //
    // A failure here is not worth blocking the login over — the session would
    // simply persist as before, so it is logged and the sign-in continues.
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch (err) {
      console.warn(`Session left on the default persistence: ${err.message}`);
    }

    // The password comes from the field the manager typed, not from code.
    // Firebase verifies it — not a string comparison in the browser.
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