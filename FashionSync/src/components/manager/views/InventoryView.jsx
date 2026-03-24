import styles from "../../../styles/Manager.module.scss";

const SEASON_COLORS = {
  קיץ: { bg: "rgba(230,126,34,0.1)", color: "#e67e22", icon: "☀️" },
  חורף: { bg: "rgba(52,152,219,0.1)", color: "#3498db", icon: "❄️" },
  "אביב/סתיו": { bg: "rgba(46,204,113,0.1)", color: "#2ecc71", icon: "🌸" },
  "כל העונות": { bg: "rgba(155,89,182,0.1)", color: "#9b59b6", icon: "🌀" },
};

function SeasonBadge({ season }) {
  const s = SEASON_COLORS[season] || { bg: "rgba(255,255,255,0.06)", color: "var(--muted)", icon: "—" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.28rem",
      padding: "0.18rem 0.6rem", borderRadius: "20px",
      background: s.bg, color: s.color, fontSize: "0.72rem", fontWeight: 700,
    }}>
      {s.icon} {season || "—"}
    </span>
  );
}

function StatusBadge({ stock, minStock }) {
  if (stock === 0) return <span className={`${styles.tag} ${styles.tRed}`}>אזל</span>;
  if (stock <= minStock) return <span className={`${styles.tag} ${styles.tYellow}`}>נמוך</span>;
  return <span className={`${styles.tag} ${styles.tGreen}`}>זמין</span>;
}

export default function InventoryView({
  products,
  onOpenDetails,
  onDeleteProduct,
  onOpenPromo,
  onCancelPromote,
  promotedCode,
})  {
  return (
    <div className={styles.view}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>ניהול מלאי</h2>
          <p>
            {products.reduce((sum, p) => sum + p.stock, 0)} יחידות ·{" "}
            {products.length} מוצרים
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.tblWrap}>
          <table>
            <thead>
              <tr>
                <th>תמונה</th>
                <th>קוד</th>
                <th>שם מוצר</th>
                <th>עונה</th>
                <th>מלאי</th>
                <th>מחיר</th>
                <th>מינימום</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isPromoted = promotedCode === p.code;
                console.log(p.code, "isPromoted:", isPromoted, "promotedCode:", promotedCode);

                return (
                  <tr key={p.code}>
                    <td>
                      <img className={styles.ptb} src={p.img} alt={p.name} />
                    </td>
                    <td>
                      <code style={{ color: "var(--gold)", fontSize: ".78rem" }}>
                        {p.code}
                      </code>
                    </td>
                    <td>
                      <div className={styles.pname}>{p.name}</div>
                      <div className={styles.psku}>{p.gender} · {p.cat}</div>
                    </td>
                    <td>
                      <SeasonBadge season={p.season} />
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.stock}</td>
                    <td style={{ color: "var(--gold)", fontWeight: 700 }}>₪{p.price}</td>
                    <td>
                      <strong style={{ color: "var(--gold)" }}>{p.minStock}</strong>
                    </td>
                    <td>
                      <StatusBadge stock={p.stock} minStock={p.minStock} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", alignItems: "center" }}>

                        <button
                          style={{
                            background: isPromoted
                              ? "linear-gradient(135deg, #2ecc71, #27ae60)"
                              : "linear-gradient(135deg, #ff6b35, #f7c59f)",
                            color: isPromoted ? "#fff" : "#1a0a00",
                            padding: ".35rem .7rem",
                            fontSize: ".75rem",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontFamily: "Alef, sans-serif",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => {
                            if (isPromoted) {
                              if (window.confirm(`לבטל את הפרסום של ${p.name}?`)) {
                                onCancelPromote();
                              }
                            } else {
                              onOpenPromo(p);
                            }
                          }}
                        >
                          {isPromoted ? "✅ בפרסום" : "📢 פרסם"}
                        </button>

                        <button
                          className={`${styles.btn} ${styles.btnGhost}`}
                          onClick={() => onOpenDetails(p)}
                        >
                          פרטים
                        </button>

                        <button
                          className={styles.btn}
                          style={{
                            background: "rgba(231,76,60,.08)",
                            border: "1px solid rgba(231,76,60,.2)",
                            color: "#f1948a",
                            padding: ".35rem .7rem",
                            fontSize: ".75rem",
                          }}
                          onClick={() => {
                            if (window.confirm("למחוק מוצר?")) onDeleteProduct(p.code);
                          }}
                        >
                          🗑️
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}