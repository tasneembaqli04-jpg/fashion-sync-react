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
 * Selects the slow-moving products worth a manager's attention.
 *
 * A fixed threshold does not survive a young catalogue. "In stock and two
 * sales or fewer" matched 101 of 114 products, which is a description of the
 * shop rather than a list of things to act on.
 *
 * The list is therefore sized relative to the catalogue and ranked on two
 * signals rather than one:
 *
 * - fewest sales first, which is what "slow" means; and
 * - among products that sold equally little, the most capital sitting on the
 *   shelf first, because 40 unsold coats matter more than 2 unsold scarves.
 *
 * The second signal is what makes the list usable at all: 71 of the products
 * have sold nothing, so sales alone cannot order them.
 *
 * @param {Array<object>} [products] - The catalogue.
 * @param {object} [options] - Sizing options.
 * @param {number} [options.share] - Fraction of the in-stock catalogue to list.
 * @param {number} [options.min] - Never show fewer than this many.
 * @param {number} [options.max] - Never show more than this many.
 * @returns {Array<object>} The slowest movers, worst first.
 */
export function getSlowProducts(
  products = [],
  { share = 0.1, min = 5, max = 15 } = {}
) {
  const ranked = rankSlowProducts(products);

  if (!ranked.length) {
    return [];
  }

  const size = Math.min(max, Math.max(min, Math.ceil(ranked.length * share)));

  return ranked.slice(0, Math.min(size, ranked.length));
}

/**
 * The whole catalogue in slow-moving order, worst first.
 *
 * Same ranking as getSlowProducts without the sizing. A screen that reveals
 * the list a part at a time wants the full order rather than a slice of it:
 * the cap exists because a long list was unusable, and once the list can be
 * expanded on request there is no reason to stop the manager at fifteen.
 *
 * @param {Array<object>} [products] - The catalogue.
 * @returns {Array<object>} Every in-stock product, slowest first.
 */
export function rankSlowProducts(products = []) {
  const inStock = products.filter((product) => (Number(product.stock) || 0) > 0);

  if (!inStock.length) {
    return [];
  }

  return [...inStock].sort((first, second) => {
    const firstSales = Number(first.salesLastMonth) || 0;
    const secondSales = Number(second.salesLastMonth) || 0;

    if (firstSales !== secondSales) {
      return firstSales - secondSales;
    }

    const firstValue = (Number(first.stock) || 0) * (Number(first.price) || 0);
    const secondValue = (Number(second.stock) || 0) * (Number(second.price) || 0);

    if (firstValue !== secondValue) {
      return secondValue - firstValue;
    }

    // Stable, so the panel does not reshuffle between renders.
    return String(first.code || "").localeCompare(String(second.code || ""));
  });
}

/**
 * Revenue recognised for a single order.
 *
 * Measured from the goods that left the shop, not from the cash that came in.
 * Two consequences follow, and both are the point of measuring it this way:
 *
 * 1. **Shipping is excluded.** The order total carries the delivery fee the
 *    customer paid, while the expense side holds unit costs only. Counting the
 *    fee as income with no carrier charge against it books every paid delivery
 *    as pure margin. No carrier charge is recorded anywhere, so the honest
 *    figure is a gross margin on goods, with delivery left out of both sides.
 *
 * 2. **Gift cards behave correctly without needing a field.** Selling a gift
 *    card is a liability, not income: the shop has taken cash and owes goods.
 *    Income belongs to the moment the goods are handed over. Measuring from
 *    the cash collected got this backwards — the card sale was excluded, and
 *    then redeeming it lowered the total of the order it was spent on, so the
 *    amount was never recognised at all. Measuring the goods instead
 *    recognises the full value on delivery, whatever paid for it. The order
 *    document does not record how much of a gift card was redeemed, so this is
 *    also the only formulation available.
 *
 * Coupon and points discounts are real reductions in the price of goods and
 * are subtracted. They are apportioned to the goods share of the order,
 * because an order can hold both goods and gift cards while the discount is
 * recorded once for the order as a whole.
 *
 * @param {object} order - The order.
 * @returns {number} Revenue attributable to goods delivered.
 */
export function getOrderGoodsRevenue(order) {
  const items = Array.isArray(order?.items) ? order.items : [];

  const goodsValue = items.reduce(
    (sum, item) =>
      item.isGiftCard
        ? sum
        : sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
    0
  );

  if (goodsValue <= 0) {
    // No goods on the order. Either it is a gift card sale, which is a
    // liability, or there is nothing to recognise.
    return 0;
  }

  const itemsValue = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
    0
  );

  const discounts =
    (Number(order.discountAmount) || 0) +
    (Number(order.pointsDiscountAmount) || 0);

  // With no gift cards on the order the share is 1 and the discount applies in
  // full, which is the ordinary case.
  const goodsShare = itemsValue > 0 ? goodsValue / itemsValue : 1;

  return Math.max(0, goodsValue - discounts * goodsShare);
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

  // Orders that failed are left out of every figure on the screen.
  //
  // A sale is measured from the moment the order is placed, because that is
  // when the stock leaves the shelf: decrementProductsStock runs at checkout,
  // not on approval. An order still waiting for a decision is a sale not yet
  // approved rather than a sale that did not happen, so it stays in.
  //
  // Cancelled and rejected are the two outcomes that are certain. Neither
  // reached the customer and both put their stock back, so counting them
  // would report goods as sold that are on the shelf.
  //
  // Every other figure here is derived from monthOrders — revenue, expenses,
  // the average order and the category split — so excluding them once is what
  // keeps those four consistent with the count beside them.
  const monthOrders = realOrders.filter(
    (order) =>
      !order.cancelled &&
      !order.rejected &&
      isSameMonth(order.date || order.createdAt, now)
  );

  const monthRevenue = monthOrders.reduce(
    (sum, order) => sum + getOrderGoodsRevenue(order),
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
  //
  // Kept to one decimal place. A whole-shekel average multiplied back by the
  // order count lands up to half a shekel per order away from the revenue
  // beside it: 8,346 over 37 orders shows 226, and 226 × 37 is 8,362. One
  // decimal narrows that spread by a factor of ten while staying readable.
  const avgOrder = salesCount
    ? Math.round((adjustedRevenue / salesCount) * 10) / 10
    : 0;

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
