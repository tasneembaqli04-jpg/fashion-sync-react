import { useEffect, useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import deliveriesStyles from "../../../styles/manager/ManagerDeliveries.module.scss";
import OrderDetailsModal from "../modals/OrderDetailsModal";
import { isOrderOverdue } from "../../../functions/manager/managerHelpers";
import { useLanguage } from "../../../translations/LanguageProvider";

function getMonthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ManagerDeliveries({ orders = [], onAdvanceStatus, loading = false }) {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.deliveries;
  const STEP_LABELS = dict.orderStatusLabels;
  const MONTH_NAMES = dict.monthNames;
  const locale = lang === "en" ? "en-US" : "he-IL";

  const STAGE_TABS = [
    { value: "all", label: t.allTab },
    { value: 0, label: STEP_LABELS[0] },
    { value: 1, label: STEP_LABELS[1] },
    { value: 2, label: STEP_LABELS[2] },
    { value: 3, label: STEP_LABELS[3] },
  ];

  function fmtDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
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

  const [stageFilter, setStageFilter] = useState(0);
  const [monthFilter, setMonthFilter] = useState(getMonthKey(new Date()));
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pickupOnly, setPickupOnly] = useState(false);

  const confirmedOrders = useMemo(
    () => orders.filter((order) => order.confirmed && !order.cancelled),
    [orders],
  );

  const availableMonths = useMemo(() => {
    const keys = new Set(confirmedOrders.map((o) => getMonthKey(o.createdAt)));
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
  }, [confirmedOrders]);

  useEffect(() => {
    if (monthFilter === "all") return;
    if (availableMonths.length === 0) return;
    if (!availableMonths.includes(monthFilter)) {
      setMonthFilter(availableMonths[0]);
    }
  }, [availableMonths]);

  const monthFilteredOrders = useMemo(() => {
    if (monthFilter === "all") return confirmedOrders;
    return confirmedOrders.filter((order) => getMonthKey(order.createdAt) === monthFilter);
  }, [confirmedOrders, monthFilter]);

  const sortedOrders = useMemo(() => {
    return [...monthFilteredOrders].sort((a, b) => {
      const aDone = (a.stageIndex ?? 0) >= 3;
      const bDone = (b.stageIndex ?? 0) >= 3;

      if (aDone !== bDone) return aDone ? 1 : -1;

      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });
  }, [monthFilteredOrders]);

  const visibleOrders = useMemo(() => {
    let list = sortedOrders;
    if (stageFilter !== "all") {
      list = list.filter((order) => (order.stageIndex ?? 0) === stageFilter);
    }
    if (pickupOnly) {
      list = list.filter((order) => order.shipping?.id === "pickup");
    }
    return list;
  }, [sortedOrders, stageFilter, pickupOnly]);

  const pickupOrdersCount = useMemo(
    () => sortedOrders.filter((order) => order.shipping?.id === "pickup").length,
    [sortedOrders]
  );

  function countFor(stageValue) {
    if (stageValue === "all") return monthFilteredOrders.length;
    return monthFilteredOrders.filter((order) => (order.stageIndex ?? 0) === stageValue).length;
  }

  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div style={{ marginBottom: "0.8rem" }}>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontSize: "0.95rem",
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

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1.2rem",
        }}
      >
        {STAGE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={uiStyles.filterTab}
            onClick={() => setStageFilter(tab.value)}
            style={
              stageFilter === tab.value
                ? {
                    background: "var(--gold-dim)",
                    color: "var(--gold)",
                    borderColor: "var(--border-gold)",
                  }
                : {}
            }
          >
            {tab.label} ({countFor(tab.value)})
          </button>
        ))}

        {pickupOrdersCount > 0 && (
          <button
            type="button"
            onClick={() => setPickupOnly((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              borderRadius: "10px",
              border: pickupOnly ? "1.5px solid var(--blue)" : "1px solid var(--border)",
              background: pickupOnly ? "rgba(52,152,219,0.12)" : "transparent",
              color: pickupOnly ? "var(--blue)" : "var(--muted)",
              fontFamily: "Alef, sans-serif",
              fontSize: "0.85rem",
              fontWeight: pickupOnly ? 700 : 400,
              cursor: "pointer",
            }}
          >
            🏪 {t.selfPickupBadge} ({pickupOrdersCount})
          </button>
        )}
      </div>

      {!visibleOrders.length ? (
        <div className={deliveriesStyles.emptyState}>
          <div className={deliveriesStyles.emptyIcon}>🚚</div>
          <div className={deliveriesStyles.emptyText}>{t.noOrdersInStage}</div>
        </div>
      ) : (
        <div className={deliveriesStyles.deliveriesList}>
          {visibleOrders.map((order) => {
            const currentIndex = order.stageIndex ?? 0;
            const nextIndex = currentIndex < 3 ? currentIndex + 1 : null;
            const createdAtText = fmtDate(order.createdAt);
            const isPickup = order.shipping?.id === "pickup";
            const orderStepLabels = isPickup ? dict.pickupStatusLabels : STEP_LABELS;

            return (
              <div className={deliveriesStyles.deliveryCard} key={order.docId}>
                <div className={deliveriesStyles.deliveryTop}>
                  <div className={deliveriesStyles.deliveryHeadInfo}>
                    <div className={deliveriesStyles.deliveryCustomerLine}>
                      <span className={deliveriesStyles.deliveryCustomerName}>
                        {(lang === "en" && (order.customerDetails?.nameEn || order.customerEmbedded?.nameEn)) ||
                          order.customerDetails?.name ||
                          order.customerEmbedded?.name ||
                          `${order.customerEmbedded?.firstName || ""} ${order.customerEmbedded?.lastName || ""}`.trim() ||
                          order.customerDetails?.email ||
                          order.customerEmail ||
                          t.defaultCustomer}
                      </span>
                      <span className={deliveriesStyles.deliveryUserIcon}>👤</span>
                      {isPickup && (
                        <span
                          style={{
                            marginInlineStart: "0.5rem",
                            background: "rgba(52,152,219,0.1)",
                            color: "var(--blue)",
                            border: "1px solid rgba(52,152,219,0.25)",
                            borderRadius: "20px",
                            padding: "0.15rem 0.6rem",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          🏪 {t.selfPickupBadge}
                        </span>
                      )}
                    </div>

                    <div className={deliveriesStyles.deliveryMetaLine}>
                      <span className={deliveriesStyles.deliveryOrderId}>
                        {order.id}
                      </span>
                      {isOrderOverdue(order) && (
                        <span
                          className={`${uiStyles.tag} ${uiStyles.tRed}`}
                          style={{ marginInlineStart: "0.5rem" }}
                        >
                          {t.overdueTag}
                        </span>
                      )}
                    </div>

                    {isPickup && (order.pickupDate || order.pickupTime) && (
                      <div style={{ fontSize: "0.8rem", color: "var(--blue)" }}>
                        🗓️ {order.pickupDate} {order.pickupTime}
                      </div>
                    )}

                    {!!createdAtText && (
                      <div className={deliveriesStyles.deliveryDate}>
                        <span>{createdAtText}</span>
                        <span className={deliveriesStyles.deliveryClock}>🕒</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={deliveriesStyles.deliveryTimeline}>
                  <div className={deliveriesStyles.deliveryTimelineLine} />

                  {orderStepLabels.map((label, i) => {
                    const isDone = i <= currentIndex;
                    const isActive = i === currentIndex;

                    return (
                      <div className={deliveriesStyles.deliveryStep} key={label}>
                        <div
                          className={`${deliveriesStyles.deliveryDot} ${
                            isDone ? deliveriesStyles.deliveryDotDone : ""
                          } ${isActive ? deliveriesStyles.deliveryDotActive : ""}`}
                        >
                          {isDone ? "✓" : ""}
                        </div>

                        <div
                          className={`${deliveriesStyles.deliveryStepLabel} ${
                            isActive
                              ? deliveriesStyles.deliveryStepLabelActive
                              : ""
                          }`}
                        >
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    padding: "0.5rem 0",
                    color: "var(--muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  {order.items?.length || 0} {t.itemsCountSuffix}
                </div>

                <div className={deliveriesStyles.deliveryBottom}>
                  <button
                    type="button"
                    className={deliveriesStyles.deliveryDetailsBtn}
                    onClick={() => setSelectedOrder(order)}
                  >
                    {t.orderDetailsButton}
                  </button>

                  {nextIndex !== null && (
                    <button
                      type="button"
                      className={deliveriesStyles.deliveryActionBtn}
                      onClick={() => onAdvanceStatus?.(order.docId, nextIndex, isPickup)}
                    >
                      {t.updateToPrefix} {orderStepLabels[nextIndex]}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OrderDetailsModal
        open={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}