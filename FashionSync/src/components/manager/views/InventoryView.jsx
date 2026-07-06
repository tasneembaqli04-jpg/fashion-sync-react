import { useMemo, useState } from "react";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import inventoryStyles from "../../../styles/manager/ManagerInventory.module.scss";
import { he } from "../../../translations/he";
import { CATEGORIES } from "../../../data/categories";
const t = he.manager.inventory;
const common = he.common;

const SEASON_COLORS = {
  [t.seasons.summer]: {
    bg: "rgba(230,126,34,0.1)",
    color: "#e67e22",
    icon: "☀️",
  },
  [t.seasons.winter]: {
    bg: "rgba(52,152,219,0.1)",
    color: "#3498db",
    icon: "❄️",
  },
  [t.seasons.springFall]: {
    bg: "rgba(46,204,113,0.1)",
    color: "#2ecc71",
    icon: "🌸",
  },
  [t.seasons.allSeasons]: {
    bg: "rgba(155,89,182,0.1)",
    color: "#9b59b6",
    icon: "🌀",
  },
};

function SeasonBadge({ season }) {
  const s = SEASON_COLORS[season] || {
    bg: "rgba(255,255,255,0.06)",
    color: "var(--muted)",
    icon: common.none,
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
      {s.icon} {season || common.none}
    </span>
  );
}

function StatusBadge({ stock, minStock }) {
  if (stock === 0) {
    return (
      <span className={`${uiStyles.tag} ${uiStyles.tRed}`}>
        {t.badges.out}
      </span>
    );
  }

  if (stock <= minStock) {
    return (
      <span className={`${uiStyles.tag} ${uiStyles.tYellow}`}>
        {t.badges.low}
      </span>
    );
  }

  return (
    <span className={`${uiStyles.tag} ${uiStyles.tGreen}`}>
      {t.badges.available}
    </span>
  );
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

  const [categoryFilter, setCategoryFilter] = useState(t.options.allCategories);
  const [genderFilter, setGenderFilter] = useState(common.all);
  const [stockStatusFilter, setStockStatusFilter] = useState(common.all);
  const [productNameFilter, setProductNameFilter] = useState("");
  const [productCodeFilter, setProductCodeFilter] = useState("");
  const [promoOnlyFilter, setPromoOnlyFilter] = useState(common.all);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const categoryMatch =
        categoryFilter === t.options.allCategories
          ? true
          : p.cat === categoryFilter;

      const genderMatch =
        genderFilter === common.all ? true : p.gender === genderFilter;

      let stockStatusMatch = true;
      if (stockStatusFilter === t.options.stockStatus.available) {
        stockStatusMatch = p.stock > p.minStock;
      } else if (stockStatusFilter === t.options.stockStatus.low) {
        stockStatusMatch = p.stock > 0 && p.stock <= p.minStock;
      } else if (stockStatusFilter === t.options.stockStatus.out) {
        stockStatusMatch = p.stock === 0;
      }

      const productNameMatch = productNameFilter.trim()
        ? p.name.toLowerCase().includes(productNameFilter.trim().toLowerCase())
        : true;

      const productCodeMatch = productCodeFilter.trim()
        ? p.code.toLowerCase().includes(productCodeFilter.trim().toLowerCase())
        : true;

      let promoOnlyMatch = true;
      if (promoOnlyFilter === common.yes) {
        promoOnlyMatch = promotedCode === p.code;
      } else if (promoOnlyFilter === common.no) {
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
    setCategoryFilter(t.options.allCategories);
    setGenderFilter(common.all);
    setStockStatusFilter(common.all);
    setProductNameFilter("");
    setProductCodeFilter("");
    setPromoOnlyFilter(common.all);
  };

  return (
    <div className={uiStyles.view}>
      <div className={uiStyles.pageHd}>
        <div className={uiStyles.phLeft}>
          <h2>{t.title}</h2>
          <p>
            {products.reduce((sum, p) => sum + p.stock, 0)} {t.summary.units} ·{" "}
            {products.length} {t.summary.products}
          </p>
        </div>
      </div>

      <div className={inventoryStyles.filtersHeader}>
        <button
          type="button"
          className={inventoryStyles.filterToggleBtn}
          onClick={() => setShowFilters((prev) => !prev)}
        >
          {t.filterToggle} ⬇
        </button>
      </div>

      {showFilters && (
        <div className={inventoryStyles.filtersPanel}>
          <div className={inventoryStyles.filtersGrid}>
            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>
                {t.filters.category}
              </label>
              <select
                className={inventoryStyles.filterSelect}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option>{t.options.allCategories}</option>
                {CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>
                {t.filters.gender}
              </label>
              <select
                className={inventoryStyles.filterSelect}
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                <option>{common.all}</option>
                <option>{t.options.genders.men}</option>
                <option>{t.options.genders.women}</option>
                <option>{t.options.genders.kids}</option>
                <option>{t.options.genders.unisex}</option>
              </select>
            </div>

            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>
                {t.filters.stockStatus}
              </label>
              <select
                className={inventoryStyles.filterSelect}
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
              >
                <option>{common.all}</option>
                <option>{t.options.stockStatus.available}</option>
                <option>{t.options.stockStatus.low}</option>
                <option>{t.options.stockStatus.out}</option>
              </select>
            </div>

            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>
                {t.filters.productName}
              </label>
              <input
                className={inventoryStyles.filterInput}
                placeholder={t.placeholders.productName}
                value={productNameFilter}
                onChange={(e) => setProductNameFilter(e.target.value)}
              />
            </div>

            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>
                {t.filters.productCode}
              </label>
              <input
                className={inventoryStyles.filterInput}
                placeholder={t.placeholders.productCode}
                value={productCodeFilter}
                onChange={(e) => setProductCodeFilter(e.target.value)}
              />
            </div>

            <div className={inventoryStyles.filterGroup}>
              <label className={inventoryStyles.filterLabel}>
                {t.filters.promoOnly}
              </label>
              <select
                className={inventoryStyles.filterSelect}
                value={promoOnlyFilter}
                onChange={(e) => setPromoOnlyFilter(e.target.value)}
              >
                <option>{common.all}</option>
                <option>{common.yes}</option>
                <option>{common.no}</option>
              </select>
            </div>
          </div>

          <div className={inventoryStyles.filtersActions}>
            <button
              type="button"
              className={inventoryStyles.clearBtn}
              onClick={clearAllFilters}
            >
              {t.clearFilters} ✕
            </button>
          </div>
        </div>
      )}

      <div className={uiStyles.card}>
        <div className={inventoryStyles.tblWrap}>
          <table className={inventoryStyles.table}>
            <thead>
              <tr className={inventoryStyles.tr}>
                <th className={inventoryStyles.th}>{t.table.image}</th>
                <th className={inventoryStyles.th}>{t.table.code}</th>
                <th className={inventoryStyles.th}>{t.table.name}</th>
                <th className={inventoryStyles.th}>{t.table.season}</th>
                <th className={inventoryStyles.th}>{t.table.stock}</th>
                <th className={inventoryStyles.th}>{t.table.price}</th>
                <th className={inventoryStyles.th}>{t.table.min}</th>
                <th className={inventoryStyles.th}>{t.table.status}</th>
                <th className={inventoryStyles.th}>{t.table.actions}</th>
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
                            {isPromoted
                              ? t.buttons.promoted
                              : t.buttons.promote}
                          </button>
                        )}

                        <button
                          className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
                          onClick={() => onOpenDetails(p)}
                        >
                          {t.buttons.details}
                        </button>

                        <button
                          className={`${uiStyles.btn} ${inventoryStyles.deleteBtn}`}
                          onClick={() => {
                            if (window.confirm(t.messages.confirmDelete)) {
                              onDeleteProduct(p.code);
                            }
                          }}
                        >
                          {t.buttons.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filteredProducts.length && (
                <tr className={inventoryStyles.tr}>
                  <td className={inventoryStyles.emptyTd} colSpan={9}>
                    {t.messages.noResults}
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