import { useMemo, useState } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";
import deliveriesStyles from "../../../styles/manager/ManagerDeliveries.module.scss";

const STEP_LABELS = ["אושרה", "בהכנה", "נשלחה", "נמסרה"];

const LEGACY_STATUS_MAP = {
  waiting: 1,
  on_the_way: 2,
  picked: 2,
  delivered: 3,
};

function toStatusIndex(status) {
  if (typeof status === "number") return status;
  return LEGACY_STATUS_MAP[status] ?? 1;
}

function cardStyle(isSelected) {
  return {
    cursor: "pointer",
    border: isSelected ? "1.5px solid var(--gold)" : undefined,
  };
}

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

export default function ManagerDeliveries({
  deliveries = [],
  onUpdateStatus,
  onMarkAllPicked,
}) {
  const [statusFilter, setStatusFilter] = useState("pending"); // pending | delivered | all

  const waitingCount = deliveries.filter(
    (delivery) => toStatusIndex(delivery.status) < 3
  ).length;

  const deliveredCount = deliveries.filter(
    (delivery) => toStatusIndex(delivery.status) >= 3
  ).length;

  const sortedDeliveries = useMemo(() => {
    return [...deliveries].sort((a, b) => {
      const aDone = toStatusIndex(a.status) >= 3;
      const bDone = toStatusIndex(b.status) >= 3;

      if (aDone !== bDone) return aDone ? 1 : -1;

      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });
  }, [deliveries]);

  const visibleDeliveries = useMemo(() => {
    if (statusFilter === "pending") {
      return sortedDeliveries.filter((d) => toStatusIndex(d.status) < 3);
    }
    if (statusFilter === "delivered") {
      return sortedDeliveries.filter((d) => toStatusIndex(d.status) >= 3);
    }
    return sortedDeliveries;
  }, [sortedDeliveries, statusFilter]);

  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>מעקב משלוחים</h2>
          <p>עדכן סטטוס משלוח עבור כל הזמנה מוכנה</p>
        </div>
      </div>

      <div
        className={overviewStyles.statsGrid}
        style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "1rem" }}
      >
        <div
          className={`${overviewStyles.stat} ${overviewStyles.gold}`}
          style={cardStyle(statusFilter === "pending")}
          onClick={() => setStatusFilter("pending")}
        >
          <div className={overviewStyles.statIcon}>🚚</div>
          <div className={overviewStyles.statLabel}>בתהליך</div>
          <div className={overviewStyles.statVal} style={{ color: "var(--orange)" }}>
            {waitingCount}
          </div>
          <div className={overviewStyles.statSub}>עדיין בדרך</div>
        </div>

        <div
          className={`${overviewStyles.stat} ${overviewStyles.green}`}
          style={cardStyle(statusFilter === "delivered")}
          onClick={() => setStatusFilter("delivered")}
        >
          <div className={overviewStyles.statIcon}>✅</div>
          <div className={overviewStyles.statLabel} style={{ color: "var(--green)" }}>
            נמסרו
          </div>
          <div className={overviewStyles.statVal} style={{ color: "var(--green)" }}>
            {deliveredCount}
          </div>
          <div className={overviewStyles.statSub}>הושלמו</div>
        </div>

        <div
          className={`${overviewStyles.stat} ${overviewStyles.blue}`}
          style={cardStyle(statusFilter === "all")}
          onClick={() => setStatusFilter("all")}
        >
          <div className={overviewStyles.statIcon}>📋</div>
          <div className={overviewStyles.statLabel}>סה"כ</div>
          <div className={overviewStyles.statVal} style={{ color: "var(--blue)" }}>
            {deliveries.length}
          </div>
          <div className={overviewStyles.statSub}>משלוחים</div>
        </div>
      </div>

      {!!waitingCount && (
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "flex-start" }}>
          <button
            type="button"
            className={deliveriesStyles.deliveryActionBtn}
            onClick={onMarkAllPicked}
          >
            ✓ סמן הכל כנשלח
          </button>
        </div>
      )}

      {!visibleDeliveries.length ? (
        <div className={deliveriesStyles.emptyState}>
          <div className={deliveriesStyles.emptyIcon}>🚚</div>
          <div className={deliveriesStyles.emptyText}>אין משלוחים להצגה</div>
        </div>
      ) : (
        <div className={deliveriesStyles.deliveriesList}>
          {visibleDeliveries.map((delivery) => {
            const currentIndex = toStatusIndex(delivery.status);
            const nextIndex = currentIndex < 3 ? currentIndex + 1 : null;
            const createdAtText = fmtDate(delivery.createdAt);

            return (
              <div className={deliveriesStyles.deliveryCard} key={delivery.id}>
                <div className={deliveriesStyles.deliveryTop}>
                  <div className={deliveriesStyles.deliveryHeadInfo}>
                    <div className={deliveriesStyles.deliveryCustomerLine}>
                      <span className={deliveriesStyles.deliveryCustomerName}>
                        {typeof delivery.customer === "string"
                          ? delivery.customer
                          : delivery.customer?.name || "לקוח"}
                      </span>
                      <span className={deliveriesStyles.deliveryUserIcon}>👤</span>
                    </div>

                    <div className={deliveriesStyles.deliveryMetaLine}>
                      <span className={deliveriesStyles.deliveryOrderId}>
                        {delivery.orderId}
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
                  {delivery.items?.map((item, index) => (
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
                      onClick={() => onUpdateStatus?.(delivery.id, nextIndex)}
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