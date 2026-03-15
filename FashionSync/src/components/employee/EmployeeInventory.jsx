export default function EmployeeInventory({
  products,
  inventorySearch,
  onChangeSearch,
  onOpenScan,
  onOpenNewProduct,
  onOpenStockEdit,
}) {
  const filtered = products.filter((p) => {
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return true;

    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q) ||
      p.gender.toLowerCase().includes(q)
    );
  });

  const total = products.length;
  const out = products.filter((p) => p.stock === 0).length;
  const low = products.filter((p) => p.stock > 0 && p.stock <= 3).length;

  return (
    <div className="panel active">
      <div className="page-header">
        <div className="page-title">ניהול מלאי</div>
        <div className="page-sub">
          {total} פריטים · {out} אזלו · {low} מלאי נמוך · מוצגים: {filtered.length}
        </div>
      </div>

      <div className="inv-search-bar">
        <input
          type="text"
          value={inventorySearch}
          onChange={(e) => onChangeSearch(e.target.value)}
          placeholder="🔍 חיפוש לפי שם / קוד / קטגוריה..."
        />

        <button className="btn btn-blue" onClick={() => onOpenScan("inventory")}>
          📷 סריקה מהירה
        </button>

        <button className="btn btn-gold" onClick={onOpenNewProduct}>
          ➕ מוצר חדש
        </button>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="tbl">
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
            {filtered.map((p) => (
              <tr key={p.code}>
                <td>
                  <div className="pc">
                    <img className="pimg" src={p.img} alt={p.name} />
                    <div>
                      <div className="pname">{p.name}</div>
                      <div className="psku">
                        {p.code} · {p.gender}
                      </div>
                    </div>
                  </div>
                </td>

                <td>
                  <span className="tag tag-blue">{p.cat}</span>
                </td>

                <td>
                  <span style={{ color: "var(--gold)", fontWeight: 700 }}>₪{p.price}</span>
                </td>

                <td>
                  <div className="size-grid">
                    {p.sizes.map((s) => (
                      <span className="sz ok" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: ".66rem", color: "var(--text-dim)", marginTop: "3px" }}>
                    סה"כ: {p.stock}
                  </div>
                </td>

                <td>{p.stock === 0 ? "אזל" : p.stock <= 3 ? "נמוך" : "זמין"}</td>

                <td>
                  <button className="tbl-btn" onClick={() => onOpenStockEdit(p)}>
                    ✏️ עריכה
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
