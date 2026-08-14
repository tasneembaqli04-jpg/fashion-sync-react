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

/**
 * Globe marking the control as a language switch.
 *
 * Decorative only: both buttons carry their own visible text, so the icon adds
 * nothing for a screen reader and is hidden from the accessibility tree.
 *
 * @param {object} props - Component props.
 * @param {string} props.color - Stroke colour, matched to the current theme.
 * @returns {JSX.Element} The globe icon.
 */
function GlobeIcon({ color }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{
        flexShrink: 0,
        // Logical property: resolves to the left in LTR and the right in RTL,
        // so the globe leads the buttons in both directions.
        marginInlineStart: "0.25rem",
      }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
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
    padding: "0.3rem 0.6rem",
    borderRadius: "6px",
    border: "none",
    fontFamily: "Alef, sans-serif",
    fontSize: "0.72rem",
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
        gap: "0.15rem",
        padding: "0.15rem",
        borderRadius: "8px",
        border: `1px solid ${borderColor}`,
        background: containerBg,
        ...style,
      }}
    >
      <GlobeIcon color={mutedColor} />
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