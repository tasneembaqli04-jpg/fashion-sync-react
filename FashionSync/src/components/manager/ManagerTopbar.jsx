import styles from "../../styles/Manager.module.scss";

export default function ManagerTopbar({
  globalSearch,
  onGlobalSearchChange,
  onRefresh,
  onAddProductClick,
  onOpenMobileSidebar,
  onOpenScan,
  onCancelPromote,
  currentPromotedImg,
}) {
  return (
    <div className={styles.topbar}>
      <button className={styles.mobMenuBtn} onClick={onOpenMobileSidebar}>☰</button>

      <div className={styles.topbarSearch}>
        <span style={{ color: "var(--muted)" }}>🔍</span>
        <input
          type="text"
          placeholder="חיפוש..."
          value={globalSearch}
          onChange={(e) => onGlobalSearchChange(e.target.value)}
        />
        <button
          onClick={onOpenScan}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1rem", padding: "0 0.2rem", lineHeight: 1, flexShrink: 0 }}
          title="סריקה"
        >📷</button>
      </div>

      <div className={styles.tbRight}>

        {currentPromotedImg && (
          <button
            onClick={onCancelPromote}
            title="בטל פרסום פעיל"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "9px",
              border: "1px solid rgba(46,204,113,0.35)",
              background: "rgba(46,204,113,0.09)",
              color: "#2ecc71",
              fontFamily: "Alef, sans-serif",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.18s",
              whiteSpace: "nowrap",
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = "rgba(231,76,60,0.1)";
              e.currentTarget.style.borderColor = "rgba(231,76,60,0.35)";
              e.currentTarget.style.color = "#f1948a";
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = "rgba(46,204,113,0.09)";
              e.currentTarget.style.borderColor = "rgba(46,204,113,0.35)";
              e.currentTarget.style.color = "#2ecc71";
            }}
          >
            <img
              src={currentPromotedImg}
              alt="promoted"
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "4px",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
            📢 פרסום פעיל — בטל
          </button>
        )}

        <button
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={onRefresh}
          title="רענן"
        >🔄</button>

        <button
          className={`${styles.btn} ${styles.btnGold}`}
          onClick={onAddProductClick}
        >+ מוצר חדש</button>

      </div>
    </div>
  );
}