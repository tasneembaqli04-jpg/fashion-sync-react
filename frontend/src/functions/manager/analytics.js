import { resolveTimestamp } from "../../utils/dates";

/**
 * Whether a date falls in the current calendar month.
 *
 * Comparison is in local time on both sides, so an ISO timestamp stored in UTC
 * is bucketed by the month the manager actually experienced.
 *
 * @param {*} value - Date value to test.
 * @param {number} [now] - Reference time in ms. Injectable for tests.
 * @returns {boolean} true when the date is in the reference month.
 */
export function isSameMonth(value, now = Date.now()) {
  const time = resolveTimestamp(value);

  if (time === null) {
    return false;
  }

  const date = new Date(time);
  const reference = new Date(now);

  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

/**
 * Calculates the monthly figures shown on the analytics screen.
 *
 * Extracted from the view so the arithmetic can be exercised directly. Every
 * ratio is guarded against an empty denominator, and the average is derived
 * from the same revenue figure the screen displays, so the two reconcile.
 *
 * @param {object} input - Calculation input.
 * @param {Array<object>} [input.orders] - All orders.
 * @param {Array<object>} [input.products] - Catalogue, used for unit costs.
 * @param {Array<object>} [input.returnRequests] - All return requests.
 * @param {string} [input.otherCategoryLabel] - Label for items with no category.
 * @param {number} [input.now] - Reference time in ms. Injectable for tests.
 * @returns {object} The figures rendered by the analytics screen.
 */
export function calculateMonthlyStats({
  orders = [],
  products = [],
  returnRequests = [],
  otherCategoryLabel = "אחר",
  now = Date.now(),
} = {}) {
  // Gift card sales are excluded from the trading figures. The length check
  // matters: `[].every(...)` is true, so an order with an empty items array
  // would otherwise be classified as a gift card sale and dropped from every
  // figure on the screen.
  const realOrders = orders.filter(
    (order) =>
      !Array.isArray(order.items) ||
      order.items.length === 0 ||
      !order.items.every((item) => item.isGiftCard)
  );

  const monthOrders = realOrders.filter((order) =>
    isSameMonth(order.date || order.createdAt, now)
  );

  const monthRevenue = monthOrders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0
  );
  const salesCount = monthOrders.length;

  let missingCostCount = 0;
  const monthExpenses = monthOrders.reduce((sum, order) => {
    const orderExpense = (order.items || []).reduce((itemSum, item) => {
      if (item.isGiftCard) return itemSum;

      const product = products.find((p) => p.code === item.code);
      const cost = Number(product?.cost) || 0;

      // A cost of 0 is a real figure, not a missing one, so the check is for
      // absence rather than falsiness.
      if (!product || product.cost === undefined || product.cost === null) {
        missingCostCount += 1;
      }

      return itemSum + cost * (Number(item.qty) || 0);
    }, 0);

    return sum + orderExpense;
  }, 0);

  const approvedReturnsThisMonth = returnRequests.filter(
    (request) => request.status === "approved" && isSameMonth(request.createdAt, now)
  );

  const returnsRevenueDeduction = approvedReturnsThisMonth.reduce(
    (sum, request) =>
      sum + (Number(request.price) || 0) * (Number(request.qty) || 1),
    0
  );

  const returnsExpenseRecovered = approvedReturnsThisMonth
    .filter((request) => request.reasonKey !== "defective")
    .reduce((sum, request) => {
      const product = products.find((p) => p.code === request.itemCode);
      const cost = Number(product?.cost) || 0;
      return sum + cost * (Number(request.qty) || 1);
    }, 0);

  const adjustedRevenue = monthRevenue - returnsRevenueDeduction;
  const adjustedExpenses = monthExpenses - returnsExpenseRecovered;
  const monthProfit = adjustedRevenue - adjustedExpenses;

  // Averaged over the revenue the screen actually displays, so that
  // avgOrder × salesCount reconciles with the revenue figure beside it.
  // Averaging the gross revenue instead would show two numbers on one screen
  // that cannot both be true.
  const avgOrder = salesCount ? Math.round(adjustedRevenue / salesCount) : 0;

  const categoryMap = {};
  monthOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      if (item.isGiftCard) return;
      const product = products.find((p) => p.code === item.code);
      const category = product?.cat || otherCategoryLabel;
      const itemTotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
      categoryMap[category] = (categoryMap[category] || 0) + itemTotal;
    });
  });

  const categorySales = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  const maxCategorySale = Math.max(1, ...categorySales.map(([, value]) => value));

  const ordersByCustomer = {};
  realOrders.forEach((order) => {
    const email = order.customerEmail || "unknown";
    ordersByCustomer[email] = (ordersByCustomer[email] || 0) + 1;
  });

  const totalCustomers = Object.keys(ordersByCustomer).length;
  const repeatCustomers = Object.values(ordersByCustomer).filter(
    (count) => count > 1
  ).length;
  const repeatPct = totalCustomers
    ? Math.round((repeatCustomers / totalCustomers) * 100)
    : 0;

  return {
    monthRevenue: adjustedRevenue,
    monthExpenses: adjustedExpenses,
    monthProfit,
    missingCostCount,
    salesCount,
    avgOrder,
    categorySales,
    maxCategorySale,
    repeatPct,
    returnsRevenueDeduction,
    returnsCount: approvedReturnsThisMonth.length,
  };
}
