export default function EmployeeTopbar({
  currentUser,
  onToggleSidebar,
  onShowPanel,
  onOpenScan,
  onOpenNewProduct,
  onRefresh,
}) {
  return (
    <div className="topbar visible">
      <button className="hamburger" onClick={onToggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      <button className="quick-btn qb-sell" onClick={() => onShowPanel("sell")}>
        🏷️ <span className="qb-label">מכירה</span>
      </button>

      <button className="quick-btn qb-scan" onClick={() => onOpenScan("inventory")}>
        📷 <span className="qb-label">ברקוד</span>
      </button>

      <button
        className="quick-btn qb-inventory"
        onClick={() => onShowPanel("inventory")}
      >
        📦 <span className="qb-label">מלאי</span>
      </button>

      <button className="quick-btn qb-newprod" onClick={onOpenNewProduct}>
        ➕ <span className="qb-label">מוצר חדש</span>
      </button>

      <div className="topbar-sep"></div>

      <button className="quick-btn qb-refresh" onClick={onRefresh} title="רענן">
        🔄
      </button>

      <span className="topbar-greeting">
        <strong>{currentUser?.name || "—"}</strong>
      </span>
    </div>
  );
}
