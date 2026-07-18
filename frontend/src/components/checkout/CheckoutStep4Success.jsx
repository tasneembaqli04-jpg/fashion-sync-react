import styles from "../../styles/checkout/CheckoutSuccess.module.scss";
import { useLanguage } from "../../translations/LanguageProvider";

export default function CheckoutStep4Success({
  isCash = false,
  isGiftCardOnly = false,
  email = "",
  receiptId = "",
  items = [],
  shippingCost = 0,
  discount = 0,
  total = 0,
  onBackToStore,
  onPrint,
}) {
  const { t: dict } = useLanguage();
  const t = dict.customer.checkout.step4;
  const priceT = dict.customer.checkout.priceBox;

  return (
    <div className={styles.stepPanel}>
      <div className={styles.successWrap}>
        <div className={styles.successCircle}>
          {isGiftCardOnly ? "🎁" : isCash ? "🕐" : "✅"}
        </div>

        <div className={styles.successTitle}>
          {isGiftCardOnly
            ? t.titleGiftCard
            : isCash
              ? t.titleCash
              : t.titleDefault}
        </div>

        <div className={styles.successSub}>
          {isGiftCardOnly
            ? t.subGiftCard
            : isCash
              ? t.subCash
              : t.subDefault}
        </div>

        <div className={styles.successSubGold}>
          {isCash && !isGiftCardOnly ? t.cashPaymentNote : email}
        </div>

        <div className={styles.receiptNum}>
          {isGiftCardOnly ? t.receiptNumberPurchase : t.receiptNumberOrder} {receiptId}
        </div>

        <div className={`${styles.card} ${styles.successOrderBox}`}>
          <div className={styles.secTitle}>{t.orderDetailsTitle}</div>

          <div>
            {items.map((item) => (
              <div key={`${item.code}-${item.size}-${item.color}`} className={styles.successItemRow}>
                <img src={item.img} alt={item.name} />

                <div className={styles.successItemInfo}>
                  <div className={styles.successItemName}>{item.name}</div>
                  <div className={styles.successItemMeta}>
                    {[item.size, item.color].filter(Boolean).join(" · ")} × {item.qty}
                  </div>
                  {item.isGiftCard && (
                    <div
                      style={{
                        marginTop: "0.4rem",
                        padding: "0.4rem 0.7rem",
                        borderRadius: "8px",
                        border: "1px dashed var(--gold)",
                        color: "var(--gold)",
                        fontWeight: 900,
                        fontSize: "0.9rem",
                        display: "inline-block",
                      }}
                    >
                      {t.giftCardCodeLabel} {item.code}
                    </div>
                  )}
                </div>

                <div className={styles.successItemPrice}>
                  ₪{(item.price * item.qty).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.successDivider}></div>

          <div className={styles.pline}>
            <span className={styles.pl}>{priceT.shipping}</span>
            <span>{shippingCost === 0 ? priceT.freeShipping : `₪${shippingCost}`}</span>
          </div>

          {discount > 0 && (
            <div className={`${styles.pline} ${styles.disc}`}>
              <span className={styles.pl}>{priceT.discount}</span>
              <span>−₪{discount.toLocaleString()}</span>
            </div>
          )}

          <div className={`${styles.pline} ${styles.total}`}>
            <span className={styles.pl}>
              {isCash ? t.payInStore : t.totalPaid}
            </span>
            <span>₪{total.toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.successBtns}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={onBackToStore}
          >
            {t.backToStore}
          </button>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnGold}`}
            onClick={onPrint}
          >
            {t.printReceipt}
          </button>
        </div>
      </div>
    </div>
  );
}