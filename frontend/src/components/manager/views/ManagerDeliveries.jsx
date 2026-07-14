import { useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import deliveriesStyles from "../../../styles/manager/ManagerDeliveries.module.scss";

const STEP_LABELS = ["אושרה", "בהכנה", "נשלחה", "נמסרה"];

const STAGE_TABS = [
  { value: "all", label: "🔔 הכל" },
  { value: 0, label: "אושרה" },
  { value: 1, label: "בהכנה" },
  { value: 2, label: "נשלחה" },
  { value: 3, label: "נמסרה" },
];

function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ManagerDeliveries({ orders = [], onAdvanceStatus }) {
  const [stageFilter, setStageFilter] = useState("all");

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aDone = (a.stageIndex ?? 0) >= 3;
      const bDone = (b.stageIndex ?? 0) >= 3;

      if (aDone !== bDone) return aDone ? 1 : -1;

      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (stageFilter === "all") return sortedOrders;
    return sortedOrders.filter((order) => (order.stageIndex ?? 0) === stageFilter);
  }, [sortedOrders, stageFilter]);

  function countFor(stageValue) {
    if (stageValue === "all") return orders.length;
    return orders.filter((order) => (order.stageIndex ?? 0) === stageValue).length;
  }

  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>מעקב משלוחים</h2>
          <p>עדכן סטטוס משלוח עבור כל הזמנה</p>
        </div>
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
      </div>

      {!visibleOrders.length ? (
        <div className={deliveriesStyles.emptyState}>
          <div className={deliveriesStyles.emptyIcon}>🚚</div>
          <div className={deliveriesStyles.emptyText}>אין הזמנות בשלב הזה</div>
        </div>
      ) : (
        <div className={deliveriesStyles.deliveriesList}>
          {visibleOrders.map((order) => {
            const currentIndex = order.stageIndex ?? 0;
            const nextIndex = currentIndex < 3 ? currentIndex + 1 : null;
            const createdAtText = fmtDate(order.createdAt);

            return (
              <div className={deliveriesStyles.deliveryCard} key={order.docId}>
                <div className={deliveriesStyles.deliveryTop}>
                  <div className={deliveriesStyles.deliveryHeadInfo}>
                    <div className={deliveriesStyles.deliveryCustomerLine}>
                      <span className={deliveriesStyles.deliveryCustomerName}>
                        {order.customerDetails?.name ||
                          order.customerDetails?.email ||
                          order.customerEmail ||
                          "לקוח"}
                      </span>
                      <span className={deliveriesStyles.deliveryUserIcon}>👤</span>
                    </div>

                    <div className={deliveriesStyles.deliveryMetaLine}>
                      <span className={deliveriesStyles.deliveryOrderId}>
                        {order.id}
                      </span>
                    </div>

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

                  {STEP_LABELS.map((label, i) => {
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

                <div className={deliveriesStyles.deliveryItemsStrip}>
                  {order.items?.map((item, index) => (
                    <div className={deliveriesStyles.deliveryItemRow} key={index}>
                      <img
                        className={deliveriesStyles.deliveryItemImg}
                        src={item.img}
                        alt={item.name}
                      />

                      <div className={deliveriesStyles.deliveryItemText}>
                        <div className={deliveriesStyles.deliveryItemName}>
                          {item.name}
                        </div>
                        <div className={deliveriesStyles.deliveryItemMeta}>
                          מידה: {item.size} · כמות: {item.qty} · ₪{item.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {nextIndex !== null && (
                  <div className={deliveriesStyles.deliveryBottom}>
                    <button
                      type="button"
                      className={deliveriesStyles.deliveryActionBtn}
                      onClick={() => onAdvanceStatus?.(order.docId, nextIndex)}
                    >
                      ✓ עדכן ל: {STEP_LABELS[nextIndex]}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}