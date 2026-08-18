import { useEffect, useMemo, useState } from "react";
import { withPolicyNumbers } from "../../data/storePolicy";
import commonStyles from "../../styles/customer/Customer.module.scss";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";
import { getBusinessHours } from "../../services/settings/businessHoursService";
import { canCancelOrder, canRequestReturn } from "../../functions/customer/orderPolicy";
import { getItemName } from "../../functions/customer/itemDisplay";
import { setPickupSchedule } from "../../services/orders/ordersService";
import { sendPickupScheduledEmail } from "../../services/email/emailService";
import MonthFilter from "../common/MonthFilter";
import {
  getMonthKey,
  matchesMonthFilter,
} from "../../functions/shared/monthFilter";
import { formatDate, formatDateTime } from "../../functions/shared/dateFormat";
import LoadMoreButton from "../common/LoadMoreButton";
import { useProgressiveList } from "../../hooks/useProgressiveList";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function CustomerOrders({ show, orders = [], returnRequests = [], onRequestReturn, onCancelOrder, onUpdateOrder }) {
  const { t: dict, lang } = useLanguage();
  const t = dict.customer.orders;
  const rt = dict.customer.returns;

  const [businessHours, setBusinessHoursState] = useState(null);
  const [pickupInputs, setPickupInputs] = useState({});
  const [pickupErrors, setPickupErrors] = useState({});
  const [pickupSaving, setPickupSaving] = useState({});

  useEffect(() => {
    getBusinessHours().then(setBusinessHoursState);
  }, []);

  function validatePickupSlot(dateStr, timeStr) {
    if (!dateStr || !timeStr) return t.pickupErrorRequired || "נא לבחור תאריך ושעה";
    if (!/^\d{2}:\d{2}$/.test(timeStr)) return t.pickupErrorFormat || "פורמט שעה לא תקין";
    if (!businessHours) return t.pickupErrorFormat || "פורמט שעה לא תקין";

    const dayIndex = new Date(dateStr).getDay();
    const dayKey = DAY_KEYS[dayIndex];
    const dayConfig = businessHours.days.find((d) => d.key === dayKey);

    if (!dayConfig || !dayConfig.open) return t.pickupErrorClosed || "החנות סגורה בתאריך שנבחר";

    if (timeStr < dayConfig.openTime || timeStr > dayConfig.closeTime) {
      return (
        t.pickupErrorOutsideHours || "השעה חייבת להיות בין {open} ל-{close}"
      )
        .replace("{open}", dayConfig.openTime)
        .replace("{close}", dayConfig.closeTime);
    }

    return "";
  }

  async function handleConfirmPickupSlot(order) {
    const input = pickupInputs[order.id] || {};
    const error = validatePickupSlot(input.date, input.time);

    if (error) {
      setPickupErrors((prev) => ({ ...prev, [order.id]: error }));
      return;
    }

    setPickupSaving((prev) => ({ ...prev, [order.id]: true }));

    await setPickupSchedule(order.docId, input.date, input.time);

    sendPickupScheduledEmail({
      toEmail: order.customerEmail,
      orderId: order.id,
      pickupDate: input.date,
      pickupTime: input.time,
      lang,
    });

    onUpdateOrder?.(order.docId, { pickupDate: input.date, pickupTime: input.time });

    setPickupSaving((prev) => ({ ...prev, [order.id]: false }));
    setPickupErrors((prev) => ({ ...prev, [order.id]: "" }));
  }
  const STATUS_LABELS = dict.orderStatusLabels;

  const FILTERS = [
    { key: "all", label: t.allFilter },
    { key: 0, label: STATUS_LABELS[0] },
    { key: 1, label: STATUS_LABELS[1] },
    { key: 2, label: STATUS_LABELS[2] },
    { key: 3, label: STATUS_LABELS[3] },
  ];

  const [activeFilter, setActiveFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(getMonthKey(new Date()));
  const [showOnlyWithReturns, setShowOnlyWithReturns] = useState(false);
  const [showOnlyCancelled, setShowOnlyCancelled] = useState(false);
  const [showOnlyPickup, setShowOnlyPickup] = useState(false);

  const sortedOrders = useMemo(() => {
    const withStatus = orders.map((order) => ({
      ...order,
      _statusNum: Number(order.status) || 0,
      _timestamp: new Date(order.createdAt || order.date || 0).getTime() || 0,
    }));

    // Delivered orders sink to the bottom; everything else is newest first.
    //
    // This is the customer's reading list, so the most recent order is the one
    // she is most likely to have come to look at. The manager's screens sort
    // the other way on purpose: there the list is a work queue, and the order
    // that has waited longest is the one that needs attention first.
    return withStatus.sort((a, b) => {
      const aDelivered = a._statusNum === 3;
      const bDelivered = b._statusNum === 3;

      if (aDelivered !== bDelivered) {
        return aDelivered ? 1 : -1;
      }

      return b._timestamp - a._timestamp;
    });
  }, [orders]);

  // The customer files an order by createdAt, falling back to date, and shows
  // date on the order line. The two are a second or two apart, so the pair
  // only diverge for an order placed either side of midnight at the end of a
  // month. Left as found rather than settled, because settling it moves those
  // orders between months.
  //
  // The manager's screens do not have this: their hook fills both keys with
  // `date`, so every management screen agrees. This is the only place the two
  // timestamps are still read separately.
  const monthFilteredOrders = useMemo(() => {
    return sortedOrders.filter((order) =>
      matchesMonthFilter(monthFilter, order.createdAt || order.date),
    );
  }, [sortedOrders, monthFilter]);

  const filteredOrders = useMemo(() => {
    let list = monthFilteredOrders;

    if (activeFilter !== "all") {
      list = list.filter((order) => order._statusNum === activeFilter);
    }

    if (showOnlyWithReturns) {
      list = list.filter((order) =>
        order.items.some((item) =>
          returnRequests.some(
            (r) => r.orderId === order.id && r.itemCode === item.code
          )
        )
      );
    }

    if (showOnlyCancelled) {
      list = list.filter((order) => order.cancelled);
    }

    if (showOnlyPickup) {
      list = list.filter((order) => order.shipping?.id === "pickup");
    }

    return list;
  }, [monthFilteredOrders, activeFilter, showOnlyWithReturns, showOnlyCancelled, showOnlyPickup, returnRequests]);

  // All five controls are in the key: the status tabs, the month, and the
  // three toggles. A returning customer builds up orders over years, and
  // there is no reason to render every one of them to show her the last few.
  const orderList = useProgressiveList(filteredOrders, {
    resetKey: [
      activeFilter,
      monthFilter,
      showOnlyWithReturns,
      showOnlyCancelled,
      showOnlyPickup,
    ].join("|"),
  });

  const countsByStatus = useMemo(() => {
    const counts = { all: monthFilteredOrders.length, 0: 0, 1: 0, 2: 0, 3: 0 };
    monthFilteredOrders.forEach((order) => {
      counts[order._statusNum] = (counts[order._statusNum] || 0) + 1;
    });
    return counts;
  }, [monthFilteredOrders]);

  const ordersWithReturnsCount = useMemo(() => {
    return monthFilteredOrders.filter((order) =>
      order.items.some((item) =>
        returnRequests.some(
          (r) => r.orderId === order.id && r.itemCode === item.code
        )
      )
    ).length;
  }, [monthFilteredOrders, returnRequests]);

  const cancelledOrdersCount = useMemo(() => {
    return monthFilteredOrders.filter((order) => order.cancelled).length;
  }, [monthFilteredOrders]);

  const pickupOrdersCount = useMemo(() => {
    return monthFilteredOrders.filter((order) => order.shipping?.id === "pickup").length;
  }, [monthFilteredOrders]);

  if (!show) return null;

  return (
    <div>
      <div className={commonStyles.pageTitle}>{t.title}</div>
      <div className={commonStyles.pageSub}>{t.subtitle}</div>

      <div style={{ marginBottom: "0.8rem" }}>
        <MonthFilter
          records={sortedOrders}
          getDate={(order) => order.createdAt || order.date}
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
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                border: isActive
                  ? "1.5px solid var(--gold)"
                  : "1px solid var(--border)",
                background: isActive ? "rgba(201,168,76,0.12)" : "transparent",
                color: isActive ? "var(--gold)" : "var(--muted)",
                fontFamily: "Alef, sans-serif",
                fontSize: "0.85rem",
                fontWeight: isActive ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {label} ({countsByStatus[key] ?? 0})
            </button>
          );
        })}
      </div>

      {ordersWithReturnsCount > 0 && (
        <div style={{ marginBottom: "1.2rem" }}>
          <button
            onClick={() => setShowOnlyWithReturns((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "10px",
              border: showOnlyWithReturns
                ? "1.5px solid var(--gold)"
                : "1px solid var(--border)",
              background: showOnlyWithReturns
                ? "rgba(201,168,76,0.12)"
                : "transparent",
              color: showOnlyWithReturns ? "var(--gold)" : "var(--muted)",
              fontFamily: "Alef, sans-serif",
              fontSize: "0.82rem",
              fontWeight: showOnlyWithReturns ? 700 : 400,
              cursor: "pointer",
            }}
          >
            🔄 {t.withReturnsFilter} ({ordersWithReturnsCount})
          </button>
        </div>
      )}

      {cancelledOrdersCount > 0 && (
        <div style={{ marginBottom: "1.2rem" }}>
          <button
            onClick={() => setShowOnlyCancelled((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "10px",
              border: showOnlyCancelled
                ? "1.5px solid var(--red)"
                : "1px solid var(--border)",
              background: showOnlyCancelled
                ? "rgba(220,53,69,0.12)"
                : "transparent",
              color: showOnlyCancelled ? "var(--red)" : "var(--muted)",
              fontFamily: "Alef, sans-serif",
              fontSize: "0.82rem",
              fontWeight: showOnlyCancelled ? 700 : 400,
              cursor: "pointer",
            }}
          >
            ✕ {t.cancelledFilter} ({cancelledOrdersCount})
          </button>
        </div>
      )}

      {pickupOrdersCount > 0 && (
        <div style={{ marginBottom: "1.2rem" }}>
          <button
            onClick={() => setShowOnlyPickup((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "10px",
              border: showOnlyPickup
                ? "1.5px solid var(--blue)"
                : "1px solid var(--border)",
              background: showOnlyPickup
                ? "rgba(52,152,219,0.12)"
                : "transparent",
              color: showOnlyPickup ? "var(--blue)" : "var(--muted)",
              fontFamily: "Alef, sans-serif",
              fontSize: "0.82rem",
              fontWeight: showOnlyPickup ? 700 : 400,
              cursor: "pointer",
            }}
          >
            🏪 {t.pickupFilter} ({pickupOrdersCount})
          </button>
        </div>
      )}

      {filteredOrders.length ? (
        orderList.visible.map((order) => {
          const steps = order.shipping?.id === "pickup"
            ? dict.pickupStatusLabels
            : STATUS_LABELS;
          const status = order._statusNum;

          return (
            <div
              key={order.id}
              className={modalStyles.orderCard}
              style={
                order.cancelled
                  ? {
                      border: "1.5px solid var(--red)",
                      background: "rgba(220,53,69,0.06)",
                    }
                  : undefined
              }
            >
              <div className={modalStyles.orderTop}>
                <div>
                  <div style={{ fontWeight: 900 }}>{order.id}</div>
                  <div className={modalStyles.orderId}>
                    {formatDateTime(order.date, lang)}
                  </div>
                  {order.cancelled && (
                    <div
                      style={{
                        color: "var(--red)",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        marginTop: "0.2rem",
                      }}
                    >
                      ✕ {t.cancelledLabel}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    color: "var(--gold)",
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "1.05rem",
                    fontWeight: 900,
                  }}
                >
                  ₪{order.total}
                </div>
              </div>

              <div className={modalStyles.orderItems}>
                {order.items.map((item, index) => (
                  <span key={index}>
                    {getItemName(item, lang)} ×{item.qty}
                    {index < order.items.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>

              {order.shipping?.id === "pickup" &&
                status === 2 &&
                !order.pickupDate && (
                  <div
                    style={{
                      border: "1px solid var(--blue)",
                      borderRadius: "10px",
                      padding: "0.7rem",
                      marginTop: "0.6rem",
                      background: "rgba(52,152,219,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                      🏪 {t.pickupReadyTitle}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={pickupInputs[order.id]?.date || ""}
                        onChange={(e) =>
                          setPickupInputs((prev) => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], date: e.target.value },
                          }))
                        }
                        style={{
                          padding: "0.4rem",
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          background: "var(--surface2)",
                          color: "var(--text)",
                        }}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="14:00"
                        maxLength={5}
                        value={pickupInputs[order.id]?.time || ""}
                        onChange={(e) => {
                          if (/^[0-9:]*$/.test(e.target.value)) {
                            setPickupInputs((prev) => ({
                              ...prev,
                              [order.id]: { ...prev[order.id], time: e.target.value },
                            }));
                          }
                        }}
                        style={{
                          padding: "0.4rem",
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          background: "var(--surface2)",
                          color: "var(--text)",
                          direction: "ltr",
                          textAlign: "center",
                          width: "90px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleConfirmPickupSlot(order)}
                        disabled={pickupSaving[order.id]}
                        style={{
                          background: "var(--blue)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "0.4rem 0.9rem",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {pickupSaving[order.id] ? t.pickupSavingButton : t.pickupConfirmButton}
                      </button>
                    </div>

                    {pickupErrors[order.id] && (
                      <div style={{ color: "var(--red)", fontSize: "0.78rem" }}>
                        {pickupErrors[order.id]}
                      </div>
                    )}
                  </div>
                )}

              {order.shipping?.id === "pickup" && order.pickupDate && (
                <div style={{ color: "var(--blue)", fontSize: "0.82rem", marginTop: "0.4rem" }}>
                  🗓️ {t.pickupScheduledLabel} {formatDate(order.pickupDate, lang)}{" "}
                  {order.pickupTime}
                </div>
              )}

              {canCancelOrder(order) && (
                  <div style={{ padding: "0.4rem 0" }}>
                    <button
                      type="button"
                      onClick={() => onCancelOrder?.(order)}
                      style={{
                        background: "none",
                        border: "1px solid var(--red)",
                        color: "var(--red)",
                        borderRadius: "8px",
                        padding: "0.3rem 0.7rem",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "Alef, sans-serif",
                      }}
                    >
                      ✕ {t.cancelOrderButton}
                    </button>
                  </div>
                )}

              {status === 3 && (() => {
                const hasAvailableItem = order.items.some(
                  (item) =>
                    !returnRequests.some(
                      (r) => r.orderId === order.id && r.itemCode === item.code
                    )
                );

                const orderRequests = returnRequests.filter(
                  (r) => r.orderId === order.id
                );

                const deliveredTimestamp = new Date(
                  order.deliveredAt || order.createdAt || order.date
                ).getTime();
                const withinReturnWindow = canRequestReturn(order);

                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      padding: "0.4rem 0",
                    }}
                  >
                    {orderRequests.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {orderRequests.map((r) => (
                          <span
                            key={r.id}
                            style={{
                              fontSize: "0.76rem",
                              color:
                                r.status === "approved"
                                  ? "var(--green)"
                                  : r.status === "rejected"
                                  ? "var(--red)"
                                  : "var(--gold)",
                            }}
                          >
                            {getItemName(
                              { name: r.itemName, nameEn: r.itemNameEn },
                              lang,
                            )}
                            :{" "}
                            {r.status === "approved"
                              ? rt.statusApproved
                              : r.status === "rejected"
                              ? rt.statusRejected
                              : rt.alreadyRequested}
                          </span>
                        ))}
                      </div>
                    )}

                    {hasAvailableItem && withinReturnWindow && (
                      <button
                        type="button"
                        onClick={() => onRequestReturn?.(order)}
                        style={{
                          background: "none",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          padding: "0.25rem 0.6rem",
                          fontSize: "0.78rem",
                          color: "var(--muted)",
                          cursor: "pointer",
                          fontFamily: "Alef, sans-serif",
                        }}
                      >
                        {rt.requestButton}
                      </button>
                    )}

                    {hasAvailableItem && !withinReturnWindow && (
                      <span style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
                        {withPolicyNumbers(rt.returnWindowExpired)}
                      </span>
                    )}
                  </div>
                );
              })()}

              <div className={modalStyles.orderTimeline}>
                <div className={modalStyles.orderTimelineLine} />

                {steps.map((step, index) => {
                  const isDone = index <= status;
                  const isActive = index === status;

                  return (
                    <div className={modalStyles.orderStep} key={index}>
                      <div
                        className={`${modalStyles.orderDot} ${
                          isDone ? modalStyles.orderDotDone : ""
                        } ${isActive ? modalStyles.orderDotActive : ""}`}
                      >
                        {isDone ? "✓" : ""}
                      </div>

                      <div
                        className={`${modalStyles.orderStepLabel} ${
                          isActive ? modalStyles.orderStepLabelActive : ""
                        }`}
                      >
                        {step}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className={commonStyles.card} style={{ textAlign: "center" }}>
          {t.noOrdersInStatus}
        </div>
      )}

      <LoadMoreButton
        remaining={orderList.remaining}
        onClick={orderList.showMore}
      />
    </div>
  );
}