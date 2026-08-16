import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { signIn } from "../../services/auth/firebaseAuth";
import { sendPasswordResetRequest } from "../../services/email/emailService";
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
// its own grants nothing, and it already appears in firestore.rules and in
// Manager.jsx.
//
// The password is the secret, and it is deliberately not in this file. The
// manager types it into the form, so it never reaches the build output and is
// never shipped to a visitor's browser.
const MANAGER_EMAIL = "manager@fashionsync-internal.com";

export default function LoginOverlay({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { t: dict, lang } = useLanguage();
  const t = dict.manager.loginOverlay;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [featuredImage, setFeaturedImage] = useState("");
  const [resetStatus, setResetStatus] = useState("idle");

  useEffect(() => {
    loadFeaturedImage().then(setFeaturedImage);
  }, []);

  /**
   * Emails a password reset link to the manager account.
   *
   * The address is not asked for: there is exactly one manager account, and
   * the constant above already names it. A failure is reported rather than
   * swallowed, because the manager cannot tell an unsent link from an email
   * that is merely slow, and would otherwise sit waiting for it.
   */
  const handleForgotPassword = async () => {
    setResetStatus("sending");

    try {
      await sendPasswordResetRequest({ toEmail: MANAGER_EMAIL, lang });
      setResetStatus("sent");
    } catch (err) {
      console.warn(`Manager password reset not sent: ${err.message}`);
      setResetStatus("failed");
    }
  };

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

        {/*
          The reset goes to the manager account's own address, taken from the
          constant above rather than from a field: there is nothing for the
          manager to type, and nothing on this public screen reveals where the
          link was sent.
        */}
        <div style={{ textAlign: "start", marginBottom: "0.7rem" }}>
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetStatus === "sending"}
            style={{
              background: "none",
              border: "none",
              color: "var(--gold)",
              fontSize: "0.82rem",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            {t.forgotPasswordLink}
          </button>

          {resetStatus === "sending" && (
            <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.3rem" }}>
              {t.forgotPasswordSending}
            </div>
          )}

          {resetStatus === "sent" && (
            <div style={{ fontSize: "0.8rem", color: "var(--green)", marginTop: "0.3rem" }}>
              {t.forgotPasswordSent}
            </div>
          )}

          {resetStatus === "failed" && (
            <div style={{ fontSize: "0.8rem", color: "var(--red)", marginTop: "0.3rem" }}>
              {t.forgotPasswordFailed}
            </div>
          )}
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