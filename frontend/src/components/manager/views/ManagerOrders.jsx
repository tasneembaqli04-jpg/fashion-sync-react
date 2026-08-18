import { useMemo, useRef, useState } from "react";
import { useDialog } from "../../common/DialogProvider";
import OrderDetailsModal from "../modals/OrderDetailsModal";
import { isOrderOverdue } from "../../../functions/manager/managerHelpers";
import { needsManagerDecision } from "../../../functions/manager/orderStatus";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";
import ordersStyles from "../../../styles/manager/ManagerOrders.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import { useLanguage } from "../../../translations/LanguageProvider";
import MonthFilter from "../../common/MonthFilter";
import {
  getMonthKey,
  matchesMonthFilter,
} from "../../../functions/shared/monthFilter";
import { formatDate } from "../../../functions/shared/dateFormat";

export default function ManagerOrders({ orders = [], onConfirmOrder, onRejectOrder, loading = false }) {
  const { lang, t: dict } = useLanguage();
  const { alertDialog, confirmDialog } = useDialog();
  const t = dict.manager.orders;

  // Held in a ref rather than state because it has to take effect on the click
  // that sets it, before any re-render. A second click while the dialog is
  // open would otherwise open a second dialog over the first, and answering
  // both would decide the same order twice.
  const decidingRef = useRef(false);

  /**
   * Asks before approving or rejecting, then reports what actually happened.
   *
   * Both decisions email the customer and neither can be undone, so both are
   * confirmed first — the approval prompt names the email, and names the gift
   * card as well when the order holds one, because approving activates it.
   *
   * @param {object} order - The order being decided.
   * @param {"approve"|"reject"} decision - Which way.
   */
  async function decide(order, decision) {
    if (decidingRef.current) return;
    decidingRef.current = true;

    try {
      const holdsGiftCard = (order.items || []).some((item) => item.isGiftCard);

      const prompt =
        decision === "reject"
          ? t.confirmRejectPrompt
          : holdsGiftCard
            ? t.confirmApproveGiftCardPrompt
            : t.confirmApprovePrompt;

      if (!(await confirmDialog(prompt))) return;

      const act = decision === "reject" ? onRejectOrder : onConfirmOrder;
      const result = await act?.(order.docId);

      // An older caller that returns nothing is treated as success, so this
      // screen never reports a failure it has no evidence for.
      if (!result || result.ok) return;

      if (result.failed === "write") {
        await alertDialog(t.decisionWriteFailed);
      } else if (result.failed === "giftCard") {
        await alertDialog(t.decisionGiftCardFailed);
      } else {
        await alertDialog(t.decisionEmailFailed);
      }
    } catch (err) {
      console.error(`Order decision failed: ${err.message}`);
      await alertDialog(t.decisionWriteFailed);
    } finally {
      decidingRef.current = false;
    }
  }

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState(getMonthKey(new Date()));

  // Orders are filed by date, falling back to createdAt. Both use sites read
  // it the same way, and the cards above and the list below must agree.
  const monthFilteredOrders = useMemo(() => {
    return orders.filter((o) =>
      matchesMonthFilter(monthFilter, o.date || o.createdAt),
    );
  }, [orders, monthFilter]);

  const pending = monthFilteredOrders.filter(needsManagerDecision).length;
  const confirmed = monthFilteredOrders.filter((o) => o.confirmed && !o.cancelled && !o.rejected).length;
  const cancelled = monthFilteredOrders.filter((o) => o.cancelled).length;
  const rejected = monthFilteredOrders.filter((o) => o.rejected).length;

  const visibleOrders = orders.filter((order) => {
    if (statusFilter === "cancelled") return Boolean(order.cancelled);
    if (statusFilter === "rejected") return Boolean(order.rejected);
    if (order.cancelled || order.rejected) return false;
    if (statusFilter === "ready" && !order.confirmed) return false;
    if (statusFilter === "pending" && order.confirmed) return false;

    if (!matchesMonthFilter(monthFilter, order.date || order.createdAt)) {
      return false;
    }

    const term = searchTerm.trim();
    if (term) {
      const phoneDigits = term.replace(/\D/g, "");
      const customerPhone = String(
        order.customerDetails?.phone || order.customerEmbedded?.phone || ""
      ).replace(/\D/g, "");
      const matchesPhone = phoneDigits && customerPhone.includes(phoneDigits);
      const matchesOrderId = String(order.id || "").toLowerCase().includes(term.toLowerCase());

      if (!matchesPhone && !matchesOrderId) return false;
    }

    return true;
  });

  const cardStyle = (isActive) => ({
    cursor: "pointer",
    outline: isActive ? "2px solid #d6b65c" : "none",
    outlineOffset: "-2px",
  });

  return (
    <div className={layoutStyles.view}>
      <div className={uiStyles.pageHd}>
        <div className={uiStyles.phLeft}>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div
        className={`${overviewStyles.statsGrid} ${overviewStyles.statsCompact}`}
      >
        <div
          className={`${overviewStyles.stat} ${overviewStyles.gold}`}
          style={cardStyle(statusFilter === "pending")}
          onClick={() => setStatusFilter("pending")}
        >
          <div className={overviewStyles.statIcon}>⏳</div>
          <div className={overviewStyles.statLabel}>{t.pendingConfirmation}</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--orange)" }}
          >
            {pending}
          </div>
          <div className={overviewStyles.statSub}>{t.toHandle}</div>
        </div>

        <div
          className={`${overviewStyles.stat} ${overviewStyles.blue}`}
          style={cardStyle(statusFilter === "all")}
          onClick={() => setStatusFilter("all")}
        >
          <div className={overviewStyles.statIcon}>📋</div>
          <div className={overviewStyles.statLabel}>{t.total}</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--blue)" }}
          >
            {monthFilteredOrders.length}
          </div>
          <div className={overviewStyles.statSub}>{t.ordersSuffix}</div>
        </div>

        <div
          className={`${overviewStyles.stat} ${overviewStyles.green}`}
          style={cardStyle(statusFilter === "ready")}
          onClick={() => setStatusFilter("ready")}
        >
          <div className={overviewStyles.statIcon}>✅</div>
          <div
            className={overviewStyles.statLabel}
            style={{ color: "var(--green)" }}
          >
            {t.confirmed}
          </div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--green)" }}
          >
            {confirmed}
          </div>
          <div className={overviewStyles.statSub}>{t.handled}</div>
        </div>

        <div
          className={overviewStyles.stat}
          style={{
            ...cardStyle(statusFilter === "cancelled"),
            borderColor: statusFilter === "cancelled" ? "var(--red)" : undefined,
          }}
          onClick={() => setStatusFilter("cancelled")}
        >
          <div className={overviewStyles.statIcon}>✕</div>
          <div
            className={overviewStyles.statLabel}
            style={{ color: "var(--red)" }}
          >
            {t.cancelledLabel}
          </div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--red)" }}
          >
            {cancelled}
          </div>
          <div className={overviewStyles.statSub}>{t.cancelledSuffix}</div>
        </div>

        <div
          className={overviewStyles.stat}
          style={{
            ...cardStyle(statusFilter === "rejected"),
            borderColor: statusFilter === "rejected" ? "var(--red)" : undefined,
          }}
          onClick={() => setStatusFilter("rejected")}
        >
          <div className={overviewStyles.statIcon}>🚫</div>
          <div
            className={overviewStyles.statLabel}
            style={{ color: "var(--red)" }}
          >
            {t.rejectedLabel}
          </div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--red)" }}
          >
            {rejected}
          </div>
          <div className={overviewStyles.statSub}>{t.rejectedSuffix}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: "1 1 320px",
            maxWidth: "400px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontSize: "0.95rem",
          }}
        />

        {/* Orders are filed by date, falling back to createdAt. */}
        <MonthFilter
          records={orders}
          getDate={(o) => o.date || o.createdAt}
          value={monthFilter}
          onChange={setMonthFilter}
        />
      </div>

      {/*
        Told apart from an empty result: while the orders are still arriving
        there is nothing to report, and the celebratory "no open orders" would
        be wrong as often as it is right.
      */}
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
          {dict.common.loading}
        </div>
      ) : !visibleOrders.length ? (
        <div className={ordersStyles.emptyState}>
          <div className={ordersStyles.emptyIcon}>🎉</div>
          <div className={ordersStyles.emptyText}>
            {orders.length ? t.noOrdersFiltered : t.noOrdersOpen}
          </div>
        </div>
      ) : (
        visibleOrders.map((order) => {
          const items = Array.isArray(order.items) ? order.items : [];

          const total =
            Number(order.total) ||
            items.reduce(
              (sum, item) =>
                sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
              0
            );

          const hasCustomSize = items.some((item) => item.isCustomSize);
          const dateText = formatDate(order.date, lang);

          return (
            <div className={ordersStyles.orderCard} key={order.id}>
              <div className={ordersStyles.orderHeader}>
                <div>
                  <div className={ordersStyles.orderCustomer}>{t.orderLabel}</div>
                  <div className={ordersStyles.orderId}>{order.id}</div>
                  {!!dateText && (
                    <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                      🕒 {dateText}
                    </div>
                  )}
                  {isOrderOverdue(order) && (
                    <span
                      className={`${uiStyles.tag} ${uiStyles.tRed}`}
                      style={{ marginTop: "0.3rem", display: "inline-block" }}
                    >
                      {t.overdueTag}
                    </span>
                  )}
                </div>

                <div>
                  <span
                    className={`${uiStyles.tag} ${
                      order.cancelled || order.rejected
                        ? uiStyles.tRed
                        : order.confirmed
                        ? uiStyles.tGreen
                        : uiStyles.tYellow
                    }`}
                  >
                    {order.cancelled
                      ? t.cancelledLabel
                      : order.rejected
                      ? t.rejectedLabel
                      : order.confirmed
                      ? t.statusConfirmed
                      : t.statusPending}
                  </span>

                  {hasCustomSize && (
                    <span
                      className={uiStyles.tag}
                      style={{
                        marginRight: "0.4rem",
                        background: "rgba(230,126,34,0.12)",
                        border: "1px solid #e67e22",
                        color: "#e67e22",
                      }}
                    >
                      {t.customSizeTag}
                    </span>
                  )}

                  <div className={ordersStyles.orderTotal} style={{ marginTop: "0.4rem" }}>
                    ₪{total.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className={ordersStyles.orderStatusBar}>

                <button
                  type="button"
                  className={ordersStyles.orderDetailsBtn}
                  onClick={() => setSelectedOrder(order)}
                >
                  {t.orderDetailsButton}
                </button>

                {!order.confirmed && !order.cancelled && !order.rejected && (
                  <>
                    <button
                      type="button"
                      className={ordersStyles.orderPrepareBtn}
                      onClick={() => decide(order, "approve")}
                    >
                      {t.confirmOrderButton}
                    </button>

                    <button
                      type="button"
                      className={ordersStyles.orderPrepareBtn}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--red)",
                        color: "var(--red)",
                      }}
                      onClick={() => decide(order, "reject")}
                    >
                      {t.rejectOrderButton}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}

      <OrderDetailsModal
        open={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}