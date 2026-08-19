import { SHIPPING_OPTIONS } from "../../data/shippingOptions";
import { resolveTimestamp } from "../../utils/dates";
import { getStockStatus } from "../customer/stockPolicy";

/**
 * Stock alert requests a sold-out product must exceed before it counts as in
 * high demand.
 *
 * Exported because the overview screen names the threshold in its caption.
 * Reading it from here keeps the caption true if the number ever changes; a
 * copy written into the translation strings would quietly go stale.
 *
 * The comparison is strictly greater than, so 16 requests qualify and 15 do
 * not. The caption is worded to match.
 */
export const HIGH_DEMAND_THRESHOLD = 15;

export function isOrderOverdue(order) {
  if (!order || !order.confirmed || order.cancelled) return false;
  if ((Number(order.stageIndex) || 0) >= 3) return false;

  const shippingId = order.shipping?.id;
  if (!shippingId || shippingId === "pickup") return false;

  const maxDays =
    order.shipping?.maxDays ??
    SHIPPING_OPTIONS.find((option) => option.id === shippingId)?.maxDays;

  if (!maxDays) return false;

  // Same field order as the cancellation and return windows in orderPolicy.
  const orderTimestamp = resolveTimestamp(order.date, order.createdAt);
  if (orderTimestamp === null) return false;

  const daysElapsed = (Date.now() - orderTimestamp) / (1000 * 60 * 60 * 24);

  return daysElapsed > maxDays;
}

/**
 * Builds the alert list for the management screen.
 *
 * @param {Array<object>} products - The catalogue.
 * @param {Array<object>} [orders] - Orders in progress.
 * @param {object} t - Alert wording from the dictionary.
 * @param {string} [lang] - Interface language.
 * @param {Array<object>} [stockNotifications] - Back-in-stock requests.
 * @param {object} [settings] - Which alerts the manager asked for, and the
 * demand threshold. Defaults keep every alert on, so a shop that has never
 * opened the settings screen behaves as it always did.
 * @returns {Array<object>} The alerts to display.
 */
export function createAlerts(
  products,
  orders = [],
  t,
  lang = "he",
  stockNotifications = [],
  settings = {},
) {
  const showLowStock = settings.lowStock !== false;
  const showOutOfStock = settings.outOfStock !== false;
  const showHighDemand = settings.highDemand !== false;
  const demandThreshold =
    Number(settings.demandThreshold) > 0 ?
      Number(settings.demandThreshold) :
      HIGH_DEMAND_THRESHOLD;

  const alerts = [];

  function displayName(entity) {
    return lang === "en" && entity.nameEn ? entity.nameEn : entity.name;
  }

  function notifyRequestCount(productCode) {
    return stockNotifications.filter((n) => n.productCode === productCode).length;
  }

  products.forEach((p) => {
    const stockStatus = getStockStatus(p.stock, p.minStock);

    if (showOutOfStock && stockStatus === "out")
      alerts.push({
        key: `oos_${p.code}`,
        type: "danger",
        code: p.code,
        title: t.outOfStockTitle,
        msg: displayName(p),
        createdAt: Date.now(),
      });
    if (showLowStock && stockStatus === "low")
      alerts.push({
        key: `low_${p.code}`,
        type: "warn",
        code: p.code,
        title: t.lowStockTitle,
        msg: t.lowStockMsg.replace("{name}", displayName(p)).replace("{stock}", p.stock),
        createdAt: Date.now(),
      });

    const demandCount = stockStatus === "out" ? notifyRequestCount(p.code) : 0;

    if (showHighDemand && demandCount > demandThreshold)
      alerts.push({
        key: `demand_${p.code}`,
        type: "info",
        code: p.code,
        title: t.highDemandTitle,
        msg: t.highDemandMsg.replace("{name}", displayName(p)).replace("{count}", demandCount),
        demandCount,
        isDemand: true,
        createdAt: Date.now(),
      });
  });

  orders.forEach((order) => {
    // A cancelled or rejected order raises nothing. The alert asks the manager
    // to attend to a custom-size item, and there is no item to make on an
    // order that will not be fulfilled.
    if (order.cancelled || order.rejected) return;

    const isDone =
      order.status === "ready" ||
      order.status === "done" ||
      order.status === "completed" ||
      Number(order.status) >= 3;

    if (isDone) return;

    const customItems = Array.isArray(order.items)
      ? order.items.filter((item) => item.isCustomSize)
      : [];

    customItems.forEach((item) => {
      alerts.push({
        key: `customsize_${order.id}_${item.code}`,
        type: "warn",
        code: order.id,
        title: t.customSizeTitle,
        msg: t.customSizeMsg
          .replace("{orderId}", order.id)
          .replace("{name}", displayName(item))
          .replace("{size}", item.size),
        createdAt: Date.now(),
      });
    });

    if (isOrderOverdue(order)) {
      alerts.push({
        key: `overdue_${order.id}`,
        type: "danger",
        code: order.id,
        title: t.overdueShippingTitle,
        msg: t.overdueShippingMsg.replace("{orderId}", order.id),
        createdAt: Date.now(),
      });
    }
  });

  return alerts;
}