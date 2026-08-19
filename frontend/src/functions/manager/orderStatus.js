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

/**
 * Whether an order counts as completed trade.
 *
 * A cancelled order was called off by the customer and a rejected one was
 * refused by the manager. Neither reached the customer and both put their
 * stock back, so neither is a sale, a receipt, or a figure on any report.
 *
 * An order still waiting for a decision does count. The stock leaves the
 * shelf at checkout rather than on approval, so an undecided order is a sale
 * not yet approved rather than a sale that did not happen.
 *
 * @param {object} order - The order to test.
 * @returns {boolean} Whether it belongs in the trading figures.
 */
export function isCompletedTrade(order) {
  if (!order) return false;

  return !order.cancelled && !order.rejected;
}

/**
 * How many orders sit in each outcome, as four counts that do not overlap.
 *
 * An order can carry both the cancelled and the rejected flag: the reject
 * button is hidden once an order is cancelled, but a customer cancelling
 * while the reject dialog is open lands both writes. Counting each flag on
 * its own then put one order on two cards, and the four stopped adding up to
 * the total beside them.
 *
 * Cancelling wins that tie. The customer acted first, so the rejection was
 * written against an order that had already gone — and she is shown
 * "cancelled", which is what the manager's screen should say too rather than
 * contradicting her copy of the same order.
 *
 * The four are exhaustive as well as exclusive, so they always sum to the
 * number of orders passed in.
 *
 * @param {Array<object>} [orders] - Orders to count, already filtered by month.
 * @returns {{pending: number, confirmed: number, cancelled: number, rejected: number}}
 *          The four counts.
 */
export function countByOutcome(orders = []) {
  const list = Array.isArray(orders) ? orders : [];

  const counts = {pending: 0, confirmed: 0, cancelled: 0, rejected: 0};

  for (const order of list) {
    if (!order) continue;

    if (order.cancelled) counts.cancelled += 1;
    else if (order.rejected) counts.rejected += 1;
    else if (order.confirmed) counts.confirmed += 1;
    else counts.pending += 1;
  }

  return counts;
}
