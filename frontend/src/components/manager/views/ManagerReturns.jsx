import { useEffect, useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import {
  getAllReturnRequests,
  updateReturnStatus,
} from "../../../services/returns/returnsService";
import { sendReturnStatusEmail } from "../../../services/email/emailService";
import { restockReturnedItem } from "../../../services/products/productsService";
import { issueGiftCard } from "../../../services/giftcard/giftCardService";
import { useLanguage } from "../../../translations/LanguageProvider";
import MonthFilter from "../../common/MonthFilter";
import {
  getMonthKey,
  matchesMonthFilter,
} from "../../../functions/shared/monthFilter";
import { buildReturnCreditMessage } from "../../../functions/manager/returnCredit";

const REASON_KEY_MAP = {
  defective: "reasonDefective",
  wrongSize: "reasonWrongSize",
  notAsDescribed: "reasonNotAsDescribed",
  changedMind: "reasonChangedMind",
  other: "reasonOther",
};

function getReasonLabel(request, t) {
  const key = REASON_KEY_MAP[request.reasonKey];
  return key ? t[key] : request.reason;
}
export default function ManagerReturns({ products = [] }) {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.returns;
  const locale = lang === "en" ? "en-US" : "he-IL";

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

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [monthFilter, setMonthFilter] = useState(() => getMonthKey(new Date()));

  useEffect(() => {
    getAllReturnRequests().then((data) => {
      setRequests(data);
      setLoading(false);
    });
  }, []);

  async function handleUpdateStatus(id, status) {
    const request = requests.find((r) => r.id === id);

    await updateReturnStatus(id, status);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );

    if (!request) return;

    // Resolved once and used twice: the credit note and the status email both
    // need the item's English name, and older returns were stored without it.
    const creditProduct = products.find((p) => p.code === request.itemCode);

    let giftCardCode = "";
    let giftCardAmount = 0;

    if (status === "approved") {
      try {
        if (request.reasonKey !== "defective") {
          await restockReturnedItem({
            code: request.itemCode,
            qty: request.qty,
            color: request.color,
            size: request.size,
          });
        }
      } catch (err) {
        console.warn(`Restock skipped, return still approved: ${err.message}`);
      }

      giftCardAmount = (Number(request.price) || 0) * (Number(request.qty) || 1);

      if (giftCardAmount > 0) {
        try {
          giftCardCode = `RTN-${id.slice(0, 8).toUpperCase()}`;

          // Stored in both languages: the manager writes this note and the
          // customer reads it, and she may be reading in the other one.
          const creditNote = buildReturnCreditMessage(
            request.itemName,
            request.itemNameEn || creditProduct?.nameEn || "",
          );

          await issueGiftCard({
            code: giftCardCode,
            amount: giftCardAmount,
            buyerEmail: request.customerEmail,
            recipientName: request.customerName,
            message: creditNote.message,
            messageEn: creditNote.messageEn,
          });
        } catch (err) {
          console.warn(`Credit card not issued, return still approved: ${err.message}`);
          giftCardCode = "";
        }
      }
    }

    if (request.customerEmail) {
      sendReturnStatusEmail({
        toEmail: request.customerEmail,
        itemName: request.itemName,
        itemNameEn: request.itemNameEn || creditProduct?.nameEn || "",
        status,
        giftCardCode,
        giftCardAmount,
        lang,
      });
    }
  }

  const visibleRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!matchesMonthFilter(monthFilter, r.createdAt)) return false;
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

        {/* Returns are filed by createdAt, when the request was raised. */}
        <MonthFilter
          records={requests}
          getDate={(r) => r.createdAt}
          value={monthFilter}
          onChange={setMonthFilter}
        />
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
                <strong>
                  {(() => {
                    const product = products.find((p) => p.code === request.itemCode);
                    return lang === "en" && product?.nameEn
                      ? product.nameEn
                      : request.itemName;
                  })()}
                </strong>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                  {t.orderLabel} {request.orderId} · {request.customerName || request.customerEmail}
                </div>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.15rem" }}>
                  {t.reasonLabel} {getReasonLabel(request, t)}
                  {request.reasonKey === "defective" && (
                    <span style={{ color: "var(--red)", marginInlineStart: "0.4rem" }}>
                      ({t.noRestockNote})
                    </span>
                  )}
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