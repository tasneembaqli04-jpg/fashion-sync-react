import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import deliveriesStyles from "../../../styles/manager/ManagerDeliveries.module.scss";

const STATUS_LABELS = {
  waiting: { label: "ממתין לשליחה", color: "var(--gold)" },
  picked: { label: "נאסף על ידי שליח", color: "var(--blue)" },
  on_the_way: { label: "בדרך ללקוח", color: "var(--purple)" },
  delivered: { label: "נמסר ללקוח", color: "var(--green)" },
};

const STATUS_STEPS = ["waiting", "picked", "on_the_way", "delivered"];

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

export default function ManagerDeliveries({ deliveries = [], onUpdateStatus }) {
  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>מעקב משלוחים</h2>
          <p>עדכן סטטוס משלוח עבור כל הזמנה מוכנה</p>
        </div>
      </div>

      {!deliveries.length ? (
        <div className={deliveriesStyles.emptyState}>
          <div className={deliveriesStyles.emptyIcon}>🚚</div>
          <div className={deliveriesStyles.emptyText}>אין משלוחים פעילים</div>
        </div>
      ) : (
        <div className={deliveriesStyles.deliveriesList}>
          {deliveries.map((delivery) => {
            const currentIndex = Math.max(
              0,
              STATUS_STEPS.indexOf(delivery.status)
            );

            const nextStatus =
              currentIndex < STATUS_STEPS.length - 1
                ? STATUS_STEPS[currentIndex + 1]
                : null;

            const createdAtText = fmtDate(delivery.createdAt);
            const currentStatus =
              STATUS_LABELS[delivery.status] || STATUS_LABELS.waiting;

            return (
              <div className={deliveriesStyles.deliveryCard} key={delivery.id}>
                <div className={deliveriesStyles.deliveryTop}>
                  <div className={deliveriesStyles.deliveryHeadInfo}>
                    <div className={deliveriesStyles.deliveryCustomerLine}>
                      <span className={deliveriesStyles.deliveryCustomerName}>
                        {delivery.customer}
                      </span>
                      <span className={deliveriesStyles.deliveryUserIcon}>👤</span>
                    </div>

                    <div className={deliveriesStyles.deliveryMetaLine}>
                      <span className={deliveriesStyles.deliveryOrderId}>
                        {delivery.id}
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

                  {STATUS_STEPS.map((step, i) => {
                    const isDone = i <= currentIndex;
                    const isActive = i === currentIndex;

                    return (
                      <div className={deliveriesStyles.deliveryStep} key={step}>
                        <div
                          className={`${deliveriesStyles.deliveryDot} ${
                            isDone ? deliveriesStyles.deliveryDotDone : ""
                          } ${isActive ? deliveriesStyles.deliveryDotActive : ""}`}
                        >
                          {isActive ? "✓" : ""}
                        </div>

                        <div
                          className={`${deliveriesStyles.deliveryStepLabel} ${
                            isActive
                              ? deliveriesStyles.deliveryStepLabelActive
                              : ""
                          }`}
                        >
                          {STATUS_LABELS[step].label}
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

                {delivery.status !== "delivered" && nextStatus && (
                  <div className={deliveriesStyles.deliveryBottom}>
                    <button
                      type="button"
                      className={deliveriesStyles.deliveryActionBtn}
                      onClick={() => onUpdateStatus?.(delivery.id, nextStatus)}
                    >
                      ✓ עדכן ל: {STATUS_LABELS[nextStatus]?.label}
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