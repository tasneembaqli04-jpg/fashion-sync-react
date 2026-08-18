import { useLanguage } from "../../translations/LanguageProvider";

/**
 * The control that reveals the next part of a long list.
 *
 * It names how many records are still hidden. A button that says only "load
 * more" leaves the reader unable to tell one hidden record from a hundred,
 * which is the same fault as the fixed caps this replaces: the screen stops
 * without saying what it stopped short of.
 *
 * Renders nothing when the list is exhausted, so a screen can place it
 * unconditionally.
 *
 * @param {object} props - Component props.
 * @param {number} props.remaining - Records not yet shown.
 * @param {Function} props.onClick - Reveals the next step.
 * @param {object} [props.style] - Extra styles for the wrapper.
 */
export default function LoadMoreButton({ remaining, onClick, style }) {
  const { t: dict } = useLanguage();

  if (!remaining) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        paddingTop: "0.7rem",
        ...style,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        style={{
          background: "transparent",
          border: "1px solid var(--border-gold)",
          borderRadius: "10px",
          color: "var(--gold)",
          cursor: "pointer",
          fontFamily: "Alef, sans-serif",
          fontSize: "0.8rem",
          fontWeight: 700,
          padding: "0.45rem 1.1rem",
        }}
      >
        {dict.common.loadMore.replace("{count}", remaining)}
      </button>
    </div>
  );
}
