const ONE_HOUR_MS = 60 * 60 * 1000;
const CANCEL_WINDOW_MS = 24 * ONE_HOUR_MS;
const RETURN_WINDOW_MS = 7 * 24 * ONE_HOUR_MS;

/**
 * Checks whether a customer may still cancel an order.
 *
 * An order can be cancelled only if:
 * - it has not already been cancelled
 * - it has not reached the final delivery stage (status 3)
 * - less than 24 hours have passed since the order was placed
 *
 * @param {object} order - The order object.
 * @param {boolean} order.cancelled - Whether the order was already cancelled.
 * @param {number} order.status - Current delivery stage (0-3).
 * @param {string} order.createdAt - Order creation date (ISO).
 * @param {string} [order.date] - Fallback date when createdAt is missing.
 * @param {number} [now] - Current time in ms. Defaults to Date.now(); injectable for tests.
 * @returns {boolean} true while the order can still be cancelled.
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
 * Checks whether a customer is still within the return request window for a
 * delivered order.
 *
 * A return can be requested only if:
 * - the order reached the final delivery stage (status 3)
 * - less than 7 days have passed since delivery
 *   (when deliveredAt is missing, falls back to createdAt/date)
 *
 * @param {object} order - The order object.
 * @param {number} order.status - Current delivery stage (0-3).
 * @param {string} [order.deliveredAt] - Delivery date (ISO).
 * @param {string} [order.createdAt] - Fallback date.
 * @param {string} [order.date] - Secondary fallback date.
 * @param {number} [now] - Current time in ms. Defaults to Date.now(); injectable for tests.
 * @returns {boolean} true while a return can still be requested.
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