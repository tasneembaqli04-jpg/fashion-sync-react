/**
 * Which stock-alert requests count as the same request.
 *
 * A customer is waiting for a product, not holding a numbered ticket, so two
 * requests from the same person for the same product are one request pressed
 * twice. This module holds that rule so the application and the one-off
 * cleanup script decide identically, and so the decision can be tested without
 * a database.
 */

/**
 * The key two requests share when they are the same request.
 *
 * Email is lowercased because it is the same address however it was typed, and
 * the security rules compare it in lower case too.
 *
 * @param {object} request - A stock notification record.
 * @returns {string} The key, or an empty string when it cannot be formed.
 */
export function stockAlertKey(request) {
  const email = String(request?.email || "").trim().toLowerCase();
  const code = String(request?.productCode || "").trim();

  if (!email || !code) return "";

  return `${email} ${code}`;
}

/**
 * Whether a request is still waiting to be answered.
 *
 * Only these block a new request. An answered one is a record of something
 * that already happened: it sends nothing, and treating it as active would
 * refuse a customer who was told in one season and wants telling again in the
 * next.
 *
 * @param {object} request - A stock notification record.
 * @returns {boolean} true while the request is unanswered.
 */
export function isAwaitingRestock(request) {
  return Boolean(request) && !request.notified;
}

/**
 * Whether this customer is already waiting for this product.
 *
 * @param {Array<object>} requests - Requests to search, typically hers.
 * @param {string} email - Customer's email address.
 * @param {string} productCode - Product code.
 * @returns {boolean} true when an unanswered request already exists.
 */
export function alreadyWaiting(requests, email, productCode) {
  const wanted = stockAlertKey({ email, productCode });
  if (!wanted || !Array.isArray(requests)) return false;

  return requests.some(
    (request) => isAwaitingRestock(request) && stockAlertKey(request) === wanted,
  );
}

/**
 * Splits unanswered requests into the one to keep and the duplicates to drop.
 *
 * The earliest is kept, because that is when the customer actually asked. A
 * request with no date sorts last rather than disturbing the order, so a
 * missing field cannot cause a dated request to be deleted in favour of an
 * undated one.
 *
 * @param {Array<object>} requests - All stock notification records.
 * @returns {{keep: object[], remove: object[]}} The split.
 */
export function splitDuplicateAlerts(requests) {
  const groups = new Map();

  for (const request of Array.isArray(requests) ? requests : []) {
    if (!isAwaitingRestock(request)) continue;

    const key = stockAlertKey(request);
    if (!key) continue;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(request);
  }

  const keep = [];
  const remove = [];

  for (const list of groups.values()) {
    const ordered = [...list].sort((a, b) =>
      String(a.createdAt || "￿").localeCompare(
        String(b.createdAt || "￿"),
      ),
    );

    keep.push(ordered[0]);
    remove.push(...ordered.slice(1));
  }

  return { keep, remove };
}
