import { useEffect, useState } from "react";
import HomeBackground from "../components/home/HomeBackground.jsx";
import FloatingItems from "../components/home/FloatingItems.jsx";
import HomeNavbar from "../components/home/HomeNavbar.jsx";
import HomeHero from "../components/home/HomeHero.jsx";
import HomeFooter from "../components/home/HomeFooter.jsx";
import LoginModal from "../components/home/LoginModal.jsx";
import { loginOrCreateUser } from "../functions/home/auth.js";
import { loadFeaturedImage } from "../functions/home/featuredProduct.js";
import styles from "../styles/Home.module.scss";
import { loadTheme, saveTheme } from "../functions/home/theme.js";
import {
  LS,
  CUSTOMER_PAGE,
  getSavedUser,
  saveGuestMode,
  saveAuthUser,
} from "../functions/home/storage.js";




export default function Home() {
  const [isLight, setIsLight] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [featuredImage, setFeaturedImage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoginOpen(true);
  }

  async function handleLogin() {
    setError("");
    setLoading(true);

    const result = await loginOrCreateUser(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    window.location.href = result.redirectUrl;
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