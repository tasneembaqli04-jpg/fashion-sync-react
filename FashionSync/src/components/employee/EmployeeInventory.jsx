import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";
import inventoryStyles from "../../styles/employee/EmployeeInventory.module.scss";

export default function EmployeeInventory({
  products,
  inventorySearch,
  onChangeSearch,
  onOpenScan,
  onOpenNewProduct,
  onOpenStockEdit,
}) {
  const safeProducts = Array.isArray(products) ? products : [];

  const filtered = safeProducts.filter((p) => {
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return true;

    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.code || "").toLowerCase().includes(q) ||
      (p.cat || "").toLowerCase().includes(q) ||
      (p.gender || "").toLowerCase().includes(q)
    );
  });

  const total = safeProducts.length;
  const out = safeProducts.filter((p) => p.stock === 0).length;
  const low = safeProducts.filter((p) => p.stock > 0 && p.stock <= 3).length;

  return (
    <div className={`${layoutStyles.panel} ${layoutStyles.active}`}>
      <div className={layoutStyles.pageHeader}>
        <div className={layoutStyles.pageTitle}>ניהול מלאי</div>
        <div className={layoutStyles.pageSub}>
          {total} פריטים · {out} אזלו · {low} מלאי נמוך · מוצגים:{" "}
          {filtered.length}
        </div>
      </div>

      <div className={inventoryStyles.invSearchBar}>
        <input
          type="text"
          value={inventorySearch}
          onChange={(e) => onChangeSearch(e.target.value)}
          placeholder="🔍 חיפוש לפי שם / קוד / קטגוריה..."
        />

        <button
          className={`${layoutStyles.btn} ${layoutStyles.btnBlue}`}
          onClick={() => onOpenScan("inventory")}
        >
          📷 סריקה מהירה
        </button>

        <button
          className={`${layoutStyles.btn} ${layoutStyles.btnGold}`}
          onClick={onOpenNewProduct}
        >
          ➕ מוצר חדש
        </button>
      </div>

      <div className={layoutStyles.card} style={{ overflowX: "auto" }}>
        <table className={layoutStyles.tbl}>
          <thead>
            <tr>
              <th>פריט</th>
              <th>קטגוריה</th>
              <th>מחיר</th>
              <th>מלאי / מידות</th>
              <th>סטטוס</th>
              <th>עריכה</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    color: "var(--text-dim)",
                    padding: "2rem",
                  }}
                >
                  אין פריטים להצגה
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const sizes =
                  Array.isArray(p.sizes) && p.sizes.length
                    ? p.sizes
                    : ["S", "M", "L", "XL"];

                return (
                  <tr key={p.code}>
                    <td>
                      <div className={layoutStyles.pc}>
                        <img
                          className={layoutStyles.pimg}
                          src={p.img}
                          alt={p.name}
                        />
                        <div>
                          <div className={layoutStyles.pname}>{p.name}</div>
                          <div className={layoutStyles.psku}>
                            {p.code} · {p.gender}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`${layoutStyles.tag} ${layoutStyles.tagBlue}`}
                      >
                        {p.cat}
                      </span>
                    </td>

                    <td>
                      <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                        ₪{p.price}
                      </span>
                    </td>

                    <td>
                      <div className={layoutStyles.sizeGrid}>
                        {sizes.map((s) => (
                          <span
                            className={`${layoutStyles.sz} ${layoutStyles.ok}`}
                            key={s}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <div
                        style={{
                          fontSize: ".66rem",
                          color: "var(--text-dim)",
                          marginTop: "3px",
                        }}
                      >
                        סה"כ: {p.stock}
                      </div>
                    </td>

                    <td>
                      {p.stock === 0 ? (
                        <span
                          className={`${layoutStyles.tag} ${layoutStyles.tagRed}`}
                        >
                          אזל
                        </span>
                      ) : p.stock <= 3 ? (
                        <span
                          className={`${layoutStyles.tag} ${layoutStyles.tagOrange}`}
                        >
                          נמוך
                        </span>
                      ) : (
                        <span
                          className={`${layoutStyles.tag} ${layoutStyles.tagGreen}`}
                        >
                          זמין
                        </span>
                      )}
                    </td>

                    <td>
                      <button
                        className={layoutStyles.tblBtn}
                        onClick={() => onOpenStockEdit(p)}
                      >
                        ✏️ עריכה
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
