const ONE_HOUR_MS = 60 * 60 * 1000;
const CANCEL_WINDOW_MS = 24 * ONE_HOUR_MS;
const RETURN_WINDOW_MS = 7 * 24 * ONE_HOUR_MS;

/**
 * Determines whether a customer is still allowed to cancel an order.
 *
 * An order can be cancelled only if:
 * - it has not already been cancelled
 * - it has not reached the final delivery stage (status 3)
 * - less than 24 hours have passed since the order was placed
 *
 * @param {object} order - The order object.
 * @param {boolean} order.cancelled - Whether the order was already cancelled.
 * @param {number} order.status - The current shipping stage index (0-3).
 * @param {string} order.createdAt - ISO date string of when the order was created.
 * @param {string} [order.date] - Fallback ISO date string if createdAt is missing.
 * @param {number} [now] - Current timestamp in ms (defaults to Date.now(), injectable for tests).
 * @returns {boolean} True if the order can still be cancelled.
 */
export function canCancelOrder(order, now = Date.now()) {
  if (!order) return false;
  if (order.cancelled) return false;
  if (Number(order.status) === 3) return false;

  const createdTimestamp = new Date(order.createdAt || order.date).getTime();
  if (Number.isNaN(createdTimestamp)) return false;

  return now - createdTimestamp < CANCEL_WINDOW_MS;
}

/**
 * Determines whether a customer is still within the return-request window
 * for a delivered order.
 *
 * A return can be requested only if:
 * - the order has reached the final delivery stage (status 3)
 * - less than 7 days have passed since the order was delivered
 *   (falls back to createdAt/date if deliveredAt is missing)
 *
 * @param {object} order - The order object.
 * @param {number} order.status - The current shipping stage index (0-3).
 * @param {string} [order.deliveredAt] - ISO date string of delivery.
 * @param {string} [order.createdAt] - Fallback ISO date string.
 * @param {string} [order.date] - Further fallback ISO date string.
 * @param {number} [now] - Current timestamp in ms (defaults to Date.now(), injectable for tests).
 * @returns {boolean} True if a return can still be requested.
 */
export function canRequestReturn(order, now = Date.now()) {
  if (!order) return false;
  if (Number(order.status) !== 3) return false;

  const deliveredTimestamp = new Date(
    order.deliveredAt || order.createdAt || order.date
  ).getTime();

  if (Number.isNaN(deliveredTimestamp)) return false;

  return now - deliveredTimestamp < RETURN_WINDOW_MS;
}