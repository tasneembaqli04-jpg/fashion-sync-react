import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { he } from "./he";
import { en } from "./en";

const LanguageContext = createContext(null);

const dictionaries = { he, en };
const STORAGE_KEY = "fs_lang";

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "he";
  });

  const setLang = (nextLang) => {
    setLangState(nextLang);
    localStorage.setItem(STORAGE_KEY, nextLang);
  };

  const toggleLang = () => {
    setLang(lang === "he" ? "en" : "he");
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  const t = useMemo(() => dictionaries[lang] || dictionaries.he, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}