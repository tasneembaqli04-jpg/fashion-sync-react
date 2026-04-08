import { useMemo, useState } from "react";
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
  const [showFilters, setShowFilters] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("כל הקטגוריות");
  const [genderFilter, setGenderFilter] = useState("הכל");
  const [stockStatusFilter, setStockStatusFilter] = useState("הכל");
  const [productNameFilter, setProductNameFilter] = useState("");
  const [productCodeFilter, setProductCodeFilter] = useState("");
  const [promoOnlyFilter, setPromoOnlyFilter] = useState("הכל");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const categoryMatch =
        categoryFilter === "כל הקטגוריות" ? true : p.cat === categoryFilter;

      const genderMatch =
        genderFilter === "הכל" ? true : p.gender === genderFilter;

      let stockStatusMatch = true;
      if (stockStatusFilter === "זמין") {
        stockStatusMatch = p.stock > p.minStock;
      } else if (stockStatusFilter === "נמוך") {
        stockStatusMatch = p.stock > 0 && p.stock <= p.minStock;
      } else if (stockStatusFilter === "אזל") {
        stockStatusMatch = p.stock === 0;
      }

      const productNameMatch = productNameFilter.trim()
        ? p.name.toLowerCase().includes(productNameFilter.trim().toLowerCase())
        : true;

      const productCodeMatch = productCodeFilter.trim()
        ? p.code.toLowerCase().includes(productCodeFilter.trim().toLowerCase())
        : true;

      let promoOnlyMatch = true;
      if (promoOnlyFilter === "כן") {
        promoOnlyMatch = promotedCode === p.code;
      } else if (promoOnlyFilter === "לא") {
        promoOnlyMatch = promotedCode !== p.code;
      }

      return (
        categoryMatch &&
        genderMatch &&
        stockStatusMatch &&
        productNameMatch &&
        productCodeMatch &&
        promoOnlyMatch
      );
    });
  }, [
    products,
    categoryFilter,
    genderFilter,
    stockStatusFilter,
    productNameFilter,
    productCodeFilter,
    promoOnlyFilter,
    promotedCode,
  ]);

  const clearAllFilters = () => {
    setCategoryFilter("כל הקטגוריות");
    setGenderFilter("הכל");
    setStockStatusFilter("הכל");
    setProductNameFilter("");
    setProductCodeFilter("");
    setPromoOnlyFilter("הכל");
  };

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

      <div className={inventoryStyles.filtersHeader}>
        <button
          type="button"
          className={inventoryStyles.filterToggleBtn}
          onClick={() => setShowFilters((prev) => !prev)}
        >
          סינון ⬇
        </button>
      </div>

      {showFilters && (
        <div className={inventoryStyles.filtersPanel}>
          <div className={inventoryStyles.filtersGrid}>
            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>קטגוריה</label>
              <select
                className={inventoryStyles.filterSelect}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option>כל הקטגוריות</option>
                <option>חולצות</option>
                <option>מכנסיים</option>
                <option>שמלות</option>
                <option>עליוניות</option>
              </select>
            </div>

            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>מגדר</label>
              <select
                className={inventoryStyles.filterSelect}
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                <option>הכל</option>
                <option>גברים</option>
                <option>נשים</option>
                <option>ילדים</option>
                <option>יוניסקס</option>
              </select>
            </div>

            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>סטטוס מלאי</label>
              <select
                className={inventoryStyles.filterSelect}
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
              >
                <option>הכל</option>
                <option>זמין</option>
                <option>נמוך</option>
                <option>אזל</option>
              </select>
            </div>

            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>שם מוצר</label>
              <input
                className={inventoryStyles.filterInput}
                placeholder="חיפוש לפי שם..."
                value={productNameFilter}
                onChange={(e) => setProductNameFilter(e.target.value)}
              />
            </div>

            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>קוד מוצר</label>
              <input
                className={inventoryStyles.filterInput}
                placeholder="לדוגמה: FS-001"
                value={productCodeFilter}
                onChange={(e) => setProductCodeFilter(e.target.value)}
              />
            </div>

            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>
                מוצרים לפרסום בלבד
              </label>
              <select
                className={inventoryStyles.filterSelect}
                value={promoOnlyFilter}
                onChange={(e) => setPromoOnlyFilter(e.target.value)}
              >
                <option>הכל</option>
                <option>כן</option>
                <option>לא</option>
              </select>
            </div>
          </div>

          <div className={inventoryStyles.filtersActions}>
           
            <button
              type="button"
              className={inventoryStyles.clearBtn}
              onClick={clearAllFilters}
            >
              אפס סינונים ✕
            </button>
          </div>
        </div>
      )}

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
              {filteredProducts.map((p) => {
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

                    <td
                      className={`${inventoryStyles.td} ${inventoryStyles.stockVal}`}
                    >
                      {p.stock}
                    </td>

                    <td
                      className={`${inventoryStyles.td} ${inventoryStyles.priceVal}`}
                    >
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
                        {p.stock > 0 && (  
                          <button
                            className={`${inventoryStyles.promoBtn} ${
                              isPromoted ? inventoryStyles.promoBtnActive : ""
                            }`}
                            onClick={() => onOpenPromo(p)}
                          >
                            {isPromoted ? "✅ בפרסום" : "📢 פרסם"}
                          </button>
                        )}
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

              {!filteredProducts.length && (
                <tr className={inventoryStyles.tr}>
                  <td className={inventoryStyles.emptyTd} colSpan={9}>
                    אין מוצרים שמתאימים לסינון שנבחר
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}