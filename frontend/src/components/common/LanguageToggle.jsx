import { useLanguage } from "../../translations/LanguageProvider";

export default function LanguageToggle({ style }) {
  const { lang, setLang } = useLanguage();

  const baseBtn = {
    padding: "0.35rem 0.7rem",
    borderRadius: "7px",
    border: "none",
    fontFamily: "Alef, sans-serif",
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s",
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.2rem",
        padding: "0.2rem",
        borderRadius: "9px",
        border: "1px solid var(--border, rgba(255,255,255,0.1))",
        background: "var(--surface2, transparent)",
        ...style,
      }}
    >
      <button
        type="button"
        onClick={() => setLang("he")}
        style={{
          ...baseBtn,
          background: lang === "he" ? "var(--gold, #c9a84c)" : "transparent",
          color: lang === "he" ? "#080808" : "var(--muted, #8a90a0)",
        }}
      >
        עברית
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        style={{
          ...baseBtn,
          background: lang === "en" ? "var(--gold, #c9a84c)" : "transparent",
          color: lang === "en" ? "#080808" : "var(--muted, #8a90a0)",
        }}
      >
        English
      </button>
    </div>
  );
}