import { useEffect, useState } from "react";
import HomeBackground from "../components/home/HomeBackground.jsx";
import FloatingItems from "../components/home/FloatingItems.jsx";
import HomeNavbar from "../components/home/HomeNavbar.jsx";
import HomeHero from "../components/home/HomeHero.jsx";
import HomeFooter from "../components/home/HomeFooter.jsx";
import LoginModal from "../components/home/LoginModal.jsx";
import EmailVerificationModal from "../components/home/EmailVerificationModal.jsx";
import { loginOrCreateUser, completeVerifiedLogin } from "../functions/home/auth.js";
import { loadFeaturedImage } from "../functions/home/featuredProduct.js";
import {
  sendPasswordResetRequest,
  sendWelcomeEmail,
} from "../services/email/emailService.js";
import styles from "../styles/Home.module.scss";
import { loadTheme, saveTheme } from "../functions/home/theme.js";
import {
  LS,
  CUSTOMER_PAGE,
  getSavedUser,
  saveGuestMode,
  saveAuthUser,
} from "../functions/home/storage.js";
import { useLanguage } from "../translations/LanguageProvider";

export default function Home() {
  const { t: dict } = useLanguage();
  const [isLight, setIsLight] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [featuredImage, setFeaturedImage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState("idle");

  const [verificationOpen, setVerificationOpen] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(null);

  useEffect(() => {
    setIsLight(loadTheme());
  }, []);

  useEffect(() => {
    saveTheme(isLight);
  }, [isLight]);

  useEffect(() => {
    loadFeaturedImage().then(setFeaturedImage);
  }, []);

  function handleToggleTheme() {
    setIsLight((prev) => !prev);
  }

  function handleBrowse() {
    saveGuestMode();
    window.location.href = CUSTOMER_PAGE;
  }

  function openLoginModal() {
    const saved = getSavedUser();
    setError("");
    setEmail(saved?.email || "");
    setPassword("");
    setForgotPasswordStatus("idle");
    setLoginOpen(true);
  }

  async function handleForgotPassword(targetEmail) {
    if (!targetEmail?.trim()) return;

    setForgotPasswordStatus("sending");
    await sendPasswordResetRequest({ toEmail: targetEmail.trim() });
    setForgotPasswordStatus("sent");
  }

  async function handleLogin() {
    setError("");
    setLoading(true);

    try {
      const result = await loginOrCreateUser(email, password, dict.home.authErrors);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.needsVerification) {
        setPendingVerification(result);
        setLoginOpen(false);
        setVerificationOpen(true);
        return;
      }

      window.location.href = result.redirectUrl;
    } catch (err) {
      console.error("Login failed:", err);
      setError(dict.home.authErrors.genericError);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerified() {
    if (!pendingVerification?.pendingUser) return;

    await sendWelcomeEmail({
      toEmail: pendingVerification.email,
      name: pendingVerification.name,
    });

    const redirectUrl = completeVerifiedLogin(pendingVerification.pendingUser);
    window.location.href = redirectUrl;
  }

  function closeVerificationModal() {
    setVerificationOpen(false);
    setPendingVerification(null);
  }

  return (
    <div className={styles.homePage}>
      <HomeBackground featuredImage={featuredImage} />
      <FloatingItems />
      <HomeNavbar isLight={isLight} onToggleTheme={handleToggleTheme} />
      <HomeHero onOpenLogin={openLoginModal} onBrowse={handleBrowse} />
      <HomeFooter />

      <LoginModal
        isOpen={loginOpen}
        email={email}
        password={password}
        error={error}
        loading={loading}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onClose={() => setLoginOpen(false)}
        onSubmit={handleLogin}
        onForgotPassword={handleForgotPassword}
        forgotPasswordStatus={forgotPasswordStatus}
      />

      <EmailVerificationModal
        isOpen={verificationOpen}
        email={pendingVerification?.email || ""}
        name={pendingVerification?.name || ""}
        onClose={closeVerificationModal}
        onVerified={handleVerified}
      />
    </div>
  );
}