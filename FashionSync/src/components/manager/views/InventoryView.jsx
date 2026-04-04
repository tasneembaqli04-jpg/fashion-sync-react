import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import inventoryStyles from "../../../styles/manager/ManagerInventory.module.scss";

const SEASON_COLORS = {
  קיץ: { bg: "rgba(230,126,34,0.1)", color: "#e67e22", icon: "☀️" },
  חורף: { bg: "rgba(52,152,219,0.1)", color: "#3498db", icon: "❄️" },
  "אביב/סתיו": { bg: "rgba(46,204,113,0.1)", color: "#2ecc71", icon: "🌸" },
  "כל העונות": { bg: "rgba(155,89,182,0.1)", color: "#9b59b6", icon: "🌀" },
};

function SeasonBadge({ season }) {
  const s = SEASON_COLORS[season] || {
    bg: "rgba(255,255,255,0.06)",
    color: "var(--muted)",
    icon: "—",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.28rem",
        padding: "0.18rem 0.6rem",
        borderRadius: "20px",
        background: s.bg,
        color: s.color,
        fontSize: "0.72rem",
        fontWeight: 700,
      }}
    >
      {s.icon} {season || "—"}
    </span>
  );
}

function StatusBadge({ stock, minStock }) {
  if (stock === 0) {
    return <span className={`${uiStyles.tag} ${uiStyles.tRed}`}>אזל</span>;
  }

  if (stock <= minStock) {
    return <span className={`${uiStyles.tag} ${uiStyles.tYellow}`}>נמוך</span>;
  }

  return <span className={`${uiStyles.tag} ${uiStyles.tGreen}`}>זמין</span>;
}

export default function InventoryView({
  products = [],
  onOpenDetails,
  onDeleteProduct,
  onOpenPromo,
  onCancelPromote,
  promotedCode,
}) {
  return (
    <div className={uiStyles.view}>
      <div className={uiStyles.pageHd}>
        <div className={uiStyles.phLeft}>
          <h2>ניהול מלאי</h2>
          <p>
            {products.reduce((sum, p) => sum + p.stock, 0)} יחידות ·{" "}
            {products.length} מוצרים
          </p>
        </div>
      </div>

      <div className={uiStyles.card}>
        <div className={inventoryStyles.tblWrap}>
          <table className={inventoryStyles.table}>
            <thead>
              <tr className={inventoryStyles.tr}>
                <th className={inventoryStyles.th}>תמונה</th>
                <th className={inventoryStyles.th}>קוד</th>
                <th className={inventoryStyles.th}>שם מוצר</th>
                <th className={inventoryStyles.th}>עונה</th>
                <th className={inventoryStyles.th}>מלאי</th>
                <th className={inventoryStyles.th}>מחיר</th>
                <th className={inventoryStyles.th}>מינימום</th>
                <th className={inventoryStyles.th}>סטטוס</th>
                <th className={inventoryStyles.th}>פעולות</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => {
                const isPromoted = promotedCode === p.code;

                return (
                  <tr key={p.code} className={inventoryStyles.tr}>
                    <td className={inventoryStyles.td}>
                      <img
                        className={inventoryStyles.ptb}
                        src={p.img}
                        alt={p.name}
                      />
                    </td>

                    <td className={inventoryStyles.td}>
                      <code className={inventoryStyles.codeVal}>{p.code}</code>
                    </td>

                    <td className={inventoryStyles.td}>
                      <div className={inventoryStyles.pname}>{p.name}</div>
                      <div className={inventoryStyles.psku}>
                        {p.gender} · {p.cat}
                      </div>
                    </td>

                    <td className={inventoryStyles.td}>
                      <SeasonBadge season={p.season} />
                    </td>

                    <td className={`${inventoryStyles.td} ${inventoryStyles.stockVal}`}>
                      {p.stock}
                    </td>

                    <td className={`${inventoryStyles.td} ${inventoryStyles.priceVal}`}>
                      ₪{p.price}
                    </td>

                    <td className={inventoryStyles.td}>
                      <strong className={inventoryStyles.minVal}>
                        {p.minStock}
                      </strong>
                    </td>

                    <td className={inventoryStyles.td}>
                      <StatusBadge stock={p.stock} minStock={p.minStock} />
                    </td>

                    <td className={inventoryStyles.td}>
                      <div className={inventoryStyles.actions}>
                        <button
                          className={`${inventoryStyles.promoBtn} ${
                            isPromoted ? inventoryStyles.promoBtnActive : ""
                          }`}
                          onClick={() => onOpenPromo(p)}
                        >
                          {isPromoted ? "✅ בפרסום" : "📢 פרסם"}
                        </button>

                        <button
                          className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
                          onClick={() => onOpenDetails(p)}
                        >
                          פרטים
                        </button>

                        <button
                          className={`${uiStyles.btn} ${inventoryStyles.deleteBtn}`}
                          onClick={() => {
                            if (window.confirm("למחוק מוצר?")) {
                              onDeleteProduct(p.code);
                            }
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