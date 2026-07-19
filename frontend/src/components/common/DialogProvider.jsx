import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLanguage } from "../../translations/LanguageProvider";

const DialogContext = createContext(null);

export const globalDialog = {
  confirm: (message) => Promise.resolve(window.confirm(message)),
  alert: (message) => {
    window.alert(message);
    return Promise.resolve(true);
  },
};

export function DialogProvider({ children }) {
  const { t: dict } = useLanguage();
  const [dialogState, setDialogState] = useState(null);

  const alertDialog = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        type: "alert",
        message,
        confirmText: options.confirmText || dict.common.confirm,
        resolve,
      });
    });
  }, [dict]);

  const confirmDialog = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        type: "confirm",
        message,
        confirmText: options.confirmText || dict.common.confirm,
        cancelText: options.cancelText || dict.common.cancel,
        resolve,
      });
    });
  }, [dict]);

  useEffect(() => {
    globalDialog.confirm = confirmDialog;
    globalDialog.alert = alertDialog;
  }, [confirmDialog, alertDialog]);

  function handleClose(result) {
    if (dialogState?.resolve) dialogState.resolve(result);
    setDialogState(null);
  }

  return (
    <DialogContext.Provider value={{ alertDialog, confirmDialog }}>
      {children}

      {dialogState && (
        <div
          onClick={() => {
            if (dialogState.type === "alert") handleClose(true);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
            style={{
              background: "var(--surface, #0f1018)",
              border: "1px solid var(--border-gold, rgba(201,168,76,0.2))",
              borderRadius: "16px",
              padding: "1.6rem",
              maxWidth: "380px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              animation: "dialogFadeIn 0.18s ease",
            }}
          >
            <style>{`
              @keyframes dialogFadeIn {
                from { opacity: 0; transform: translateY(8px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>

            <div
              style={{
                color: "var(--text, #eaeaf0)",
                fontFamily: "Alef, sans-serif",
                fontSize: "1rem",
                lineHeight: "1.6",
                marginBottom: "1.4rem",
                textAlign: "center",
              }}
            >
              {dialogState.message}
            </div>

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center" }}>
              {dialogState.type === "confirm" && (
                <button
                  onClick={() => handleClose(false)}
                  style={{
                    padding: "0.6rem 1.4rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border, rgba(255,255,255,0.1))",
                    background: "transparent",
                    color: "var(--muted, #8a90a0)",
                    fontFamily: "Alef, sans-serif",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {dialogState.cancelText}
                </button>
              )}

              <button
                onClick={() => handleClose(true)}
                style={{
                  padding: "0.6rem 1.6rem",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, var(--gold, #c9a84c), var(--gold-lt, #e8c97a))",
                  color: "#080808",
                  fontFamily: "Alef, sans-serif",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return ctx;
}