import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import deliveriesStyles from "../../../styles/manager/ManagerDeliveries.module.scss";

// אותם 4 שלבים בדיוק כמו אצל הלקוח (order.steps): אושרה, בהכנה, נשלחה, נמסרה
const STEP_LABELS = ["אושרה", "בהכנה", "נשלחה", "נמסרה"];

// תאימות לאחור: אם יש עדיין רשומות ישנות עם סטטוס טקסטואלי (waiting/picked/delivered)
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
  const waitingCount = deliveries.filter(
    (delivery) => toStatusIndex(delivery.status) < 3
  ).length;

  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>מעקב משלוחים</h2>
          <p>עדכן סטטוס משלוח עבור כל הזמנה מוכנה</p>
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

      {!deliveries.length ? (
        <div className={deliveriesStyles.emptyState}>
          <div className={deliveriesStyles.emptyIcon}>🚚</div>
          <div className={deliveriesStyles.emptyText}>אין משלוחים פעילים</div>
        </div>
      ) : (
        <div className={deliveriesStyles.deliveriesList}>
          {deliveries.map((delivery) => {
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