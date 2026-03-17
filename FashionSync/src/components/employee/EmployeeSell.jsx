import { useState } from "react";
import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";
import sellStyles from "../../styles/employee/EmployeeSell.module.scss";

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
    <div className={`${layoutStyles.panel} ${layoutStyles.active}`}>
      <div className={layoutStyles.pageHeader}>
        <div className={layoutStyles.pageTitle}>סריקת מכירה</div>
        <div className={layoutStyles.pageSub}>סרוק פריטים ורשום מכירה</div>
      </div>

      <div className={layoutStyles.twoCol}>
        <div>
          <div className={layoutStyles.card} style={{ marginBottom: "1rem" }}>
            <div className={layoutStyles.secTitle}>📲 סרוק / הכנס קוד</div>

            <div className={sellStyles.barcodeRow}>
              <input
                className={`${sellStyles.barcodeInput} ${sellStyles.scanning}`}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="קוד מוצר (לדוגמה: FS-001)"
              />

              <button
                className={`${layoutStyles.btn} ${layoutStyles.btnGold}`}
                onClick={handleAdd}
              >
                + הוסף
              </button>
            </div>

            <button
              className={`${layoutStyles.btn} ${layoutStyles.btnBlue} ${layoutStyles.btnFull}`}
              style={{ marginTop: "0.55rem" }}
              onClick={() => onOpenScan("sell")}
            >
              📷 סרוק ברקוד
            </button>
          </div>
        </div>

        <div className={layoutStyles.card}>
          <div className={layoutStyles.secTitle}>🧾 פריטים למכירה</div>

          <div>
            {!sellItems.length ? (
              <div className={layoutStyles.emptyState}>
                <div className={layoutStyles.emptyIcon}>📋</div>
                <div className={layoutStyles.emptyText}>סרוק פריטים להתחיל</div>
              </div>
            ) : (
              sellItems.map((item) => (
                <div className={sellStyles.scanItem} key={item.code}>
                  <img
                    className={sellStyles.scanImg}
                    src={item.img}
                    alt={item.name}
                  />

                  <div className={sellStyles.scanInfo}>
                    <div className={sellStyles.scanName}>{item.name}</div>
                    <div className={sellStyles.scanCode}>{item.code}</div>
                  </div>

                  <div className={sellStyles.qtyWrap}>
                    <button
                      className={sellStyles.qtyBtn}
                      onClick={() => onChangeSellQty(item.code, -1)}
                    >
                      −
                    </button>
                    <span className={sellStyles.qtyNum}>{item.qty}</span>
                    <button
                      className={sellStyles.qtyBtn}
                      onClick={() => onChangeSellQty(item.code, 1)}
                    >
                      +
                    </button>
                  </div>

                  <span className={sellStyles.scanPrice}>
                    ₪{item.price * item.qty}
                  </span>

                  <button
                    className={sellStyles.scanRm}
                    onClick={() => onRemoveSellItem(item.code)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {sellItems.length > 0 && (
            <div className={sellStyles.summaryBox}>
              {sellItems.map((item) => (
                <div className={sellStyles.sumrow} key={item.code}>
                  <span>
                    {item.name} × {item.qty}
                  </span>
                  <span>₪{item.price * item.qty}</span>
                </div>
              ))}

              <div className={sellStyles.sumtotal}>
                <span style={{ color: "var(--text-dim)" }}>סה"כ מכירה:</span>
                <span className={sellStyles.sumtotalVal}>
                  ₪{total.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <button
            className={`${layoutStyles.btn} ${layoutStyles.btnGold} ${layoutStyles.btnFull} ${layoutStyles.btnLg}`}
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