import { createContext, useContext, useEffect, useMemo, useState } from "react";
import he from "../translations/he";
import en from "../translations/en";

const dictionaries = { he, en };
const LANG_KEY = "fs_lang";

const LanguageContext = createContext(null);

function getInitialLang() {
  if (typeof window === "undefined") return "he";
  const saved = window.localStorage.getItem(LANG_KEY);
  return saved === "en" || saved === "he" ? saved : "he";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    window.localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  const toggleLang = () => setLang((prev) => (prev === "he" ? "en" : "he"));

  const t = useMemo(() => dictionaries[lang] || dictionaries.he, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t, dir: lang === "he" ? "rtl" : "ltr" }),
    [lang, t]
  );

  return (
    <LanguageContext.Provider value={value}>
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