import { useEffect, useState } from "react";
import HomeBackground from "../components/home/HomeBackground.jsx";
import FloatingItems from "../components/home/FloatingItems.jsx";
import HomeNavbar from "../components/home/HomeNavbar.jsx";
import HomeHero from "../components/home/HomeHero.jsx";
import HomeFooter from "../components/home/HomeFooter.jsx";
import IntentModal from "../components/home/IntentModal.jsx";
import LoginModal from "../components/home/LoginModal.jsx";
import styles from "../styles/Home.module.scss";

const LS = {
  USERS: "fs_users",
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

function loadUsers() {
  const users = safeJsonParse(localStorage.getItem(LS.USERS), {});
  return users && typeof users === "object" && !Array.isArray(users) ? users : {};
}

function saveUsers(users) {
  localStorage.setItem(LS.USERS, JSON.stringify(users));
}

export default function Home() {
  const [isLight, setIsLight] = useState(false);
  const [intentOpen, setIntentOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [featuredImage, setFeaturedImage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem(LS.THEME);
    setIsLight(savedTheme === "light");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("light", isLight);
    localStorage.setItem(LS.THEME, isLight ? "light" : "dark");
  }, [isLight]);

  useEffect(() => {
    const image = localStorage.getItem("featuredProductImage") || "";
    setFeaturedImage(image);

    function handleStorage(e) {
      if (e.key === "featuredProductImage" || e.key === null) {
        setFeaturedImage(localStorage.getItem("featuredProductImage") || "");
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function handleToggleTheme() {
    setIsLight((prev) => !prev);
  }

  function handleBrowse() {
    setIntentOpen(false);
    localStorage.setItem(LS.MODE, "guest");
    localStorage.removeItem(LS.CURRENT_USER);
    window.location.href = CUSTOMER_PAGE;
  }

  function openLoginModal() {
    const saved = safeJsonParse(localStorage.getItem(LS.CURRENT_USER), null);
    setError("");
    setEmail(saved?.email || "");
    setPassword("");
    setIntentOpen(false);
    setLoginOpen(true);
  }

  function handleLogin() {
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

    const users = loadUsers();

    if (!users[normalizedEmail]) {
      users[normalizedEmail] = {
        password: normalizedPass,
        name: normalizedEmail.split("@")[0],
      };
      saveUsers(users);
    } else if (users[normalizedEmail].password !== normalizedPass) {
      setError("אימייל/סיסמה לא נכונים");
      return;
    }

    const user = {
      email: normalizedEmail,
      name: users[normalizedEmail].name || normalizedEmail.split("@")[0],
    };

    localStorage.setItem(LS.CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(LS.MODE, "auth");

    window.location.href =
      `${CUSTOMER_PAGE}?mode=auth&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}`;
  }

  return (
    <div className={styles.homePage}>
      <HomeBackground featuredImage={featuredImage} />
      <FloatingItems />
      <HomeNavbar isLight={isLight} onToggleTheme={handleToggleTheme} />
      <HomeHero onOpenIntent={() => setIntentOpen(true)} />
      <HomeFooter />

      <IntentModal
        isOpen={intentOpen}
        onClose={() => setIntentOpen(false)}
        onBrowse={handleBrowse}
        onGoToLogin={openLoginModal}
      />

      <LoginModal
        isOpen={loginOpen}
        email={email}
        password={password}
        error={error}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onClose={() => setLoginOpen(false)}
        onBack={() => {
          setLoginOpen(false);
          setIntentOpen(true);
        }}
        onSubmit={handleLogin}
      />
    </div>
  );
}
