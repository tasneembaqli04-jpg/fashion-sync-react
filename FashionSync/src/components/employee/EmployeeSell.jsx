import { useState } from "react";

export default function EmployeeSell({
  sellItems,
  onAddSell,
  onChangeSellQty,
  onRemoveSellItem,
  onCompleteSell,
  onOpenScan,
}) {
  const [code, setCode] = useState("");

  const total = sellItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  function handleAdd() {
    if (!code.trim()) return;
    onAddSell(code.trim());
    setCode("");
  }

  return (
    <div className="panel active">
      <div className="page-header">
        <div className="page-title">סריקת מכירה</div>
        <div className="page-sub">סרוק פריטים ורשום מכירה</div>
      </div>

      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="sec-title">📲 סרוק / הכנס קוד</div>

            <div className="barcode-row">
              <input
                className="barcode-input scanning"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="קוד מוצר (לדוגמה: FS-001)"
              />

              <button className="btn btn-gold" onClick={handleAdd}>
                + הוסף
              </button>
            </div>

            <button
              className="btn btn-blue btn-full"
              style={{ marginTop: "0.55rem" }}
              onClick={() => onOpenScan("sell")}
            >
              📷 סרוק ברקוד
            </button>
          </div>
        </div>

        <div className="card">
          <div className="sec-title">🧾 פריטים למכירה</div>

          <div>
            {!sellItems.length ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-text">סרוק פריטים להתחיל</div>
              </div>
            ) : (
              sellItems.map((item) => (
                <div className="scan-item" key={item.code}>
                  <img className="scan-img" src={item.img} alt={item.name} />

                  <div className="scan-info">
                    <div className="scan-name">{item.name}</div>
                    <div className="scan-code">{item.code}</div>
                  </div>

                  <div className="qty-wrap">
                    <button className="qty-btn" onClick={() => onChangeSellQty(item.code, -1)}>
                      −
                    </button>
                    <span className="qty-num">{item.qty}</span>
                    <button className="qty-btn" onClick={() => onChangeSellQty(item.code, 1)}>
                      +
                    </button>
                  </div>

                  <span className="scan-price">₪{item.price * item.qty}</span>

                  <button className="scan-rm" onClick={() => onRemoveSellItem(item.code)}>
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {sellItems.length > 0 && (
            <div className="summary-box">
              {sellItems.map((item) => (
                <div className="sumrow" key={item.code}>
                  <span>
                    {item.name} × {item.qty}
                  </span>
                  <span>₪{item.price * item.qty}</span>
                </div>
              ))}

              <div className="sumtotal">
                <span style={{ color: "var(--text-dim)" }}>סה"כ מכירה:</span>
                <span className="sumtotal-val">₪{total.toLocaleString()}</span>
              </div>
            </div>
          )}

          <button
            className="btn btn-gold btn-full btn-lg"
            style={{ marginTop: "0.85rem" }}
            onClick={onCompleteSell}
          >
            ✅ השלם מכירה
          </button>
        </div>
      </div>
    </div>
  );
}
