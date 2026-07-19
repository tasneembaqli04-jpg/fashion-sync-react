import { useEffect, useState } from "react";
import { useLanguage } from "../../translations/LanguageProvider";

function detectIsLight() {
  if (typeof document === "undefined") return false;
  const body = document.body;
  return (
    body.classList.contains("light") ||
    body.getAttribute("data-theme") === "light"
  );
}

export default function LanguageToggle({ style }) {
  const { lang, setLang } = useLanguage();
  const [isLight, setIsLight] = useState(detectIsLight);

  useEffect(() => {
    const update = () => setIsLight(detectIsLight());
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

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

  const mutedColor = isLight ? "#8a90a0" : "#6b7280";
  const containerBg = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
  const borderColor = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.2rem",
        padding: "0.2rem",
        borderRadius: "9px",
        border: `1px solid ${borderColor}`,
        background: containerBg,
        ...style,
      }}
    >
      <button
        type="button"
        onClick={() => setLang("he")}
        style={{
          ...baseBtn,
          background: lang === "he" ? "var(--gold, #c9a84c)" : "transparent",
          color: lang === "he" ? "#080808" : mutedColor,
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
          color: lang === "en" ? "#080808" : mutedColor,
        }}
      >
        English
      </button>
    </div>
  );
}