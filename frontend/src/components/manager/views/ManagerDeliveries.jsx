import { useEffect, useMemo, useRef, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import deliveriesStyles from "../../../styles/manager/ManagerDeliveries.module.scss";
import OrderDetailsModal from "../modals/OrderDetailsModal";
import { isOrderOverdue } from "../../../functions/manager/managerHelpers";
import { useLanguage } from "../../../translations/LanguageProvider";
import { DELIVERED_STAGE } from "../../../functions/manager/orderStatus";
import MonthFilter from "../../common/MonthFilter";
import {
  getMonthKey,
  matchesMonthFilter,
  UNKNOWN_MONTH,
} from "../../../functions/shared/monthFilter";
import { formatDateTime } from "../../../functions/shared/dateFormat";

export default function ManagerDeliveries({ orders = [], onAdvanceStatus, loading = false }) {
  const { lang, t: dict } = useLanguage();
  const t = dict.manager.deliveries;
  const STEP_LABELS = dict.orderStatusLabels;

  const STAGE_TABS = [
    { value: "all", label: t.allTab },
    { value: 0, label: STEP_LABELS[0] },
    { value: 1, label: STEP_LABELS[1] },
    { value: 2, label: STEP_LABELS[2] },
    { value: 3, label: STEP_LABELS[3] },
  ];

  const [stageFilter, setStageFilter] = useState(0);
  const [monthFilter, setMonthFilter] = useState(getMonthKey(new Date()));
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pickupOnly, setPickupOnly] = useState(false);

  // Rejected orders are excluded here as well as in the badge, so the screen
  // and the count it feeds never disagree about what is on its way.
  const confirmedOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.confirmed && !order.cancelled && !order.rejected,
      ),
    [orders],
  );

  // Landing on a month that has deliveries.
  //
  // This screen used to move itself to the newest month with orders whenever
  // the selected one had none. That was needed because its selector listed
  // only months that had orders, so the month it opened on could be missing
  // from the list entirely and nothing would appear selected.
  //
  // The shared selector always offers all twelve months, so that can no
  // longer happen — but the landing is worth keeping: opening deliveries in a
  // quiet month should still show the deliveries there are. It runs once,
  // when the orders first arrive. Running it again would undo a deliberate
  // choice of an empty month, which the manager can now make.
  const hasLanded = useRef(false);

  useEffect(() => {
    if (hasLanded.current || !confirmedOrders.length) return;
    hasLanded.current = true;

    const monthsWithOrders = [
      ...new Set(confirmedOrders.map((o) => getMonthKey(o.createdAt))),
    ]
      // Orders with no date belong to no month, and landing on them would
      // show an empty screen. The old sort put them first.
      .filter((key) => key !== UNKNOWN_MONTH)
      .sort((a, b) => (a < b ? 1 : -1));

    if (monthsWithOrders.length && !monthsWithOrders.includes(monthFilter)) {
      setMonthFilter(monthsWithOrders[0]);
    }
  }, [confirmedOrders, monthFilter]);

  const monthFilteredOrders = useMemo(() => {
    return confirmedOrders.filter((order) =>
      matchesMonthFilter(monthFilter, order.createdAt),
    );
  }, [confirmedOrders, monthFilter]);

  const sortedOrders = useMemo(() => {
    return [...monthFilteredOrders].sort((a, b) => {
      const aDone = (a.stageIndex ?? 0) >= DELIVERED_STAGE;
      const bDone = (b.stageIndex ?? 0) >= DELIVERED_STAGE;

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
        {/* Deliveries are filed by createdAt, when the order was placed. */}
        <MonthFilter
          records={confirmedOrders}
          getDate={(order) => order.createdAt}
          value={monthFilter}
          onChange={setMonthFilter}
        />
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

      {/*
        Told apart from an empty result: while the orders are still arriving
        there is nothing to report, and saying "no orders in this stage" then
        would be wrong as often as it is right.
      */}
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
          {dict.common.loading}
        </div>
      ) : !visibleOrders.length ? (
        <div className={deliveriesStyles.emptyState}>
          <div className={deliveriesStyles.emptyIcon}>🚚</div>
          <div className={deliveriesStyles.emptyText}>{t.noOrdersInStage}</div>
        </div>
      ) : (
        <div className={deliveriesStyles.deliveriesList}>
          {visibleOrders.map((order) => {
            const currentIndex = order.stageIndex ?? 0;
            const nextIndex = currentIndex < DELIVERED_STAGE ? currentIndex + 1 : null;
            const createdAtText = formatDateTime(order.createdAt, lang);
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