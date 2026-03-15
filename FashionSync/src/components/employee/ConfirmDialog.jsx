export default function ConfirmDialog({ confirmData, onCancel, onConfirm }) {
  if (!confirmData) return null;

  return (
    <>
      <div className="confirm-dialog-backdrop open" onClick={onCancel}></div>
      <div className="confirm-dialog open">
        <div className="confirm-dialog-icon">{confirmData.icon || "🗑"}</div>
        <div className="confirm-dialog-title">{confirmData.title}</div>
        <div className="confirm-dialog-sub">{confirmData.sub}</div>

        <div className="confirm-dialog-btns">
          <button className="btn btn-outline" onClick={onCancel}>
            ביטול
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmData.okLabel || "אישור"}
          </button>
        </div>
      </div>
    </>
  );
}
