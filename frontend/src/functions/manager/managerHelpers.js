import { SHIPPING_OPTIONS } from "../../data/shippingOptions";

export function isOrderOverdue(order) {
  if (!order || !order.confirmed || order.cancelled) return false;
  if ((Number(order.stageIndex) || 0) >= 3) return false;

  const shippingId = order.shipping?.id;
  if (!shippingId || shippingId === "pickup") return false;

  const maxDays =
    order.shipping?.maxDays ??
    SHIPPING_OPTIONS.find((option) => option.id === shippingId)?.maxDays;

  if (!maxDays) return false;

  const orderDate = new Date(order.date || order.createdAt);
  if (Number.isNaN(orderDate.getTime())) return false;

  const daysElapsed = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysElapsed > maxDays;
}

export function createAlerts(products, orders = [], t, lang = "he", stockNotifications = []) {
  const alerts = [];

  function displayName(entity) {
    return lang === "en" && entity.nameEn ? entity.nameEn : entity.name;
  }

  function notifyRequestCount(productCode) {
    return stockNotifications.filter((n) => n.productCode === productCode).length;
  }

  products.forEach((p) => {
    if (p.stock === 0)
      alerts.push({
        key: `oos_${p.code}`,
        type: "danger",
        code: p.code,
        title: t.outOfStockTitle,
        msg: displayName(p),
        createdAt: Date.now(),
      });
    if (p.stock > 0 && p.stock <= p.minStock)
      alerts.push({
        key: `low_${p.code}`,
        type: "warn",
        code: p.code,
        title: t.lowStockTitle,
        msg: t.lowStockMsg.replace("{name}", displayName(p)).replace("{stock}", p.stock),
        createdAt: Date.now(),
      });

    const demandCount = p.stock === 0 ? notifyRequestCount(p.code) : 0;

    if (demandCount > 15)
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