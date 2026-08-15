/**
 * Where an order stands, as one definition the badges and the screens share.
 *
 * An order carries three independent flags rather than a single status field.
 * `confirmed` is set when the manager accepts it, `rejected` when the manager
 * turns it down, and `cancelled` when the customer calls it off. None of the
 * three clears another, so "still waiting on the manager" is the absence of
 * all of them, not the absence of any one.
 *
 * That is the trap these helpers exist to close: a rejected order keeps
 * `confirmed` and `cancelled` both false, so any count that asks only
 * "not confirmed and not cancelled" keeps counting it after the manager has
 * already dealt with it, and never returns to zero.
 */

/** Delivery stage 3 is delivered, so anything below it is still in transit. */
export const DELIVERED_STAGE = 3;

/**
 * True while the order is still waiting for the manager to accept or reject
 * it. All three flags must be clear: a decision of any kind ends the wait.
 *
 * @param {object} order - Normalised order.
 * @returns {boolean} Whether the manager still owes this order a decision.
 */
export function needsManagerDecision(order) {
  // Guarded first: every flag on a missing order reads as absent, which would
  // otherwise make "no decision taken yet" true and count a hole in the list.
  if (!order) return false;
  return !order.confirmed && !order.cancelled && !order.rejected;
}

/**
 * True once the order is accepted and on its way, but not yet delivered.
 *
 * @param {object} order - Normalised order.
 * @returns {boolean} Whether the order is in transit.
 */
export function isAwaitingDelivery(order) {
  if (!order?.confirmed || order.cancelled || order.rejected) return false;
  return (Number(order.stageIndex) || 0) < DELIVERED_STAGE;
}

/**
 * How many orders are still waiting on a decision.
 *
 * @param {Array<object>} orders - Orders to count.
 * @returns {number} Count of orders needing a decision.
 */
export function countOrdersNeedingDecision(orders) {
  if (!Array.isArray(orders)) return 0;
  return orders.filter(needsManagerDecision).length;
}

/**
 * How many accepted orders have not been delivered yet.
 *
 * @param {Array<object>} orders - Orders to count.
 * @returns {number} Count of orders in transit.
 */
export function countOrdersAwaitingDelivery(orders) {
  if (!Array.isArray(orders)) return 0;
  return orders.filter(isAwaitingDelivery).length;
}
