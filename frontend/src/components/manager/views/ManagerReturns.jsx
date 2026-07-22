import { useEffect, useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import {
  getAllReturnRequests,
  updateReturnStatus,
} from "../../../services/returns/returnsService";
import { useLanguage } from "../../../translations/LanguageProvider";

function getMonthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ManagerReturns() {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.returns;
  const locale = lang === "en" ? "en-US" : "he-IL";
  const MONTH_NAMES = dict.monthNames;

  function fmtDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getMonthLabel(monthKey) {
    if (monthKey === "unknown") return dict.customer.orders.noDate;
    const [year, month] = monthKey.split("-");
    return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
  }

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [monthFilter, setMonthFilter] = useState("all");

  useEffect(() => {
    getAllReturnRequests().then((data) => {
      setRequests(data);
      setLoading(false);
    });
  }, []);

  async function handleUpdateStatus(id, status) {
    await updateReturnStatus(id, status);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }

  const availableMonths = useMemo(() => {
    const keys = new Set(requests.map((r) => getMonthKey(r.createdAt)));
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
  }, [requests]);

  const visibleRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (monthFilter !== "all" && getMonthKey(r.createdAt) !== monthFilter) {
        return false;
      }
      return true;
    });
  }, [requests, statusFilter, monthFilter]);

  return (
    <div className={layoutStyles.view}>
      <div className={uiStyles.pageHd}>
        <div className={uiStyles.phLeft}>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "1.2rem",
        }}
      >
        {[
          { key: "all", label: t.filterAll },
          { key: "pending", label: t.filterPending },
          { key: "approved", label: t.filterApproved },
          { key: "rejected", label: t.filterRejected },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={uiStyles.filterTab}
            onClick={() => setStatusFilter(tab.key)}
            style={
              statusFilter === tab.key
                ? {
                    background: "var(--gold-dim)",
                    color: "var(--gold)",
                    borderColor: "var(--border-gold)",
                  }
                : {}
            }
          >
            {tab.label}
          </button>
        ))}

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontSize: "0.9rem",
          }}
        >
          <option value="all">{t.allMonths}</option>
          {availableMonths.map((key) => (
            <option key={key} value={key}>
              {getMonthLabel(key)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>{dict.common.loading}</div>
      ) : !visibleRequests.length ? (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
          {t.noRequestsYet}
        </div>
      ) : (
        visibleRequests.map((request) => (
          <div
            key={request.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-gold)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "12px",
              color: "var(--text)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.9rem",
            }}
          >
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flex: 1, minWidth: "220px" }}>
              {request.itemImg && (
                <img
                  src={request.itemImg}
                  alt={request.itemName}
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: "cover",
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                />
              )}

              <div>
                <strong>{request.itemName}</strong>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                  {t.orderLabel} {request.orderId} · {request.customerName || request.customerEmail}
                </div>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.15rem" }}>
                  {t.reasonLabel} {request.reason}
                </div>
                {request.note && (
                  <div style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.15rem" }}>
                    {t.noteLabel} {request.note}
                  </div>
                )}
                <div style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                  🕒 {fmtDate(request.createdAt)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
              {request.status === "pending" ? (
                <>
                  <button
                    type="button"
                    className={`${uiStyles.btn} ${uiStyles.btnGold}`}
                    style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}
                    onClick={() => handleUpdateStatus(request.id, "approved")}
                  >
                    {t.approveButton}
                  </button>
                  <button
                    type="button"
                    className={`${uiStyles.btn} ${uiStyles.btnGhost}`}
                    style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}
                    onClick={() => handleUpdateStatus(request.id, "rejected")}
                  >
                    {t.rejectButton}
                  </button>
                </>
              ) : (
                <span
                  className={`${uiStyles.tag} ${
                    request.status === "approved" ? uiStyles.tGreen : uiStyles.tRed
                  }`}
                >
                  {request.status === "approved" ? t.statusApproved : t.statusRejected}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}