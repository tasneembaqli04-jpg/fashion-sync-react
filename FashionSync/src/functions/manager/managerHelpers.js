export function createAlerts(products, orders = []) {
  const alerts = [];
  products.forEach((p) => {
    if (p.stock === 0)
      alerts.push({
        key: `oos_${p.code}`,
        type: "danger",
        code: p.code,
        title: "🚫 המוצר אזל מהמלאי",
        msg: p.name,
        createdAt: Date.now(),
      });
    if (p.stock > 0 && p.stock <= p.minStock)
      alerts.push({
        key: `low_${p.code}`,
        type: "warn",
        code: p.code,
        title: "⚠️ מלאי נמוך",
        msg: `${p.name} — נותרו ${p.stock} יח׳`,
        createdAt: Date.now(),
      });
    if (p.notifyCount > 15)
      alerts.push({
        key: `demand_${p.code}`,
        type: "info",
        code: p.code,
        title: "🔥 ביקושים גבוהים",
        msg: `${p.name} — נרשמו ${p.notifyCount} בקשות`,
        demandCount: p.notifyCount,
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
        title: '🔍 בקשת מידה מיוחדת',
        msg: `הזמנה ${order.id} — ${item.name} · מידה: "${item.size}" — דורש אישור ידני`,
        createdAt: Date.now(),
      });
    });
  });

  return alerts;
}
export function buildReceipts(products) {
  if (!Array.isArray(products) || products.length < 5) {
    return [];
  }

  const p0 = products[0];
  const p1 = products[1];
  const p3 = products[3];
  const p4 = products[4];

  if (!p0 || !p1 || !p3 || !p4) {
    return [];
  }

  return [
    {
      id: "RCP-1000001",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      items: [
        { code: p0.code, name: p0.name, price: p0.price, qty: 2, img: p0.img },
        { code: p4.code, name: p4.name, price: p4.price, qty: 1, img: p4.img },
      ],
      total: p0.price * 2 + p4.price,
    },
    {
      id: "RCP-1000002",
      date: new Date(Date.now() - 86400000).toISOString(),
      items: [
        { code: p1.code, name: p1.name, price: p1.price, qty: 1, img: p1.img },
      ],
      total: p1.price,
    },
    {
      id: "RCP-1000003",
      date: new Date(Date.now() - 3600000).toISOString(),
      items: [
        { code: p3.code, name: p3.name, price: p3.price, qty: 1, img: p3.img },
        { code: p4.code, name: p4.name, price: p4.price, qty: 3, img: p4.img },
      ],
      total: p3.price + p4.price * 3,
    },
  ];
}