import { useEffect, useState } from "react";
import HomeBackground from "../components/home/HomeBackground.jsx";
import FloatingItems from "../components/home/FloatingItems.jsx";
import HomeNavbar from "../components/home/HomeNavbar.jsx";
import HomeHero from "../components/home/HomeHero.jsx";
import HomeFooter from "../components/home/HomeFooter.jsx";
import LoginModal from "../components/home/LoginModal.jsx";
import { signIn, signUp } from "../backend/services/auth/firebaseAuth.js";
import { getFeaturedProduct } from "../functions/settings/featuredProductService.js";
import styles from "../styles/Home.module.scss";

const LS = {
  CURRENT_USER: "fs_current_user",
  MODE: "fs_customer_mode",
  THEME: "fs_theme",
};

const CUSTOMER_PAGE = "/customer";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function isGmail(email) {
  return /^[a-z0-9._%+-]+@gmail\.com$/.test(String(email || "").trim().toLowerCase());
}

export default function Home() {
  const [isLight, setIsLight] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [featuredImage, setFeaturedImage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(LS.THEME);
    setIsLight(savedTheme === "light");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("light", isLight);
    localStorage.setItem(LS.THEME, isLight ? "light" : "dark");
  }, [isLight]);

  useEffect(() => {
    getFeaturedProduct().then((featured) => {
      setFeaturedImage(featured?.img || "");
    });
  }, []);

  function handleToggleTheme() {
    setIsLight((prev) => !prev);
  }

  function handleBrowse() {
    localStorage.setItem(LS.MODE, "guest");
    localStorage.removeItem(LS.CURRENT_USER);
    window.location.href = CUSTOMER_PAGE;
  }

  function openLoginModal() {
    const saved = safeJsonParse(localStorage.getItem(LS.CURRENT_USER), null);
    setError("");
    setEmail(saved?.email || "");
    setPassword("");
    setLoginOpen(true);
  }

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPass = password.trim();
    setError("");

    if (!isGmail(normalizedEmail)) {
      setError("אימייל לא תקין — חייב להיות ‎@gmail.com");
      return;
    }
    if (normalizedPass.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }

    setLoading(true);

    let result = await signIn(normalizedEmail, normalizedPass);

    if (result.error === "אימייל או סיסמה שגויים") {
      result = await signUp(normalizedEmail, normalizedPass);
    }

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const user = result.user;
    localStorage.setItem(LS.CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(LS.MODE, "auth");
    window.location.href = `${CUSTOMER_PAGE}?mode=auth&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}`;
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
      />
    </div>
  );
}