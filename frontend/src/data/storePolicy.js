/**
 * The numbers the shop's rules are made of.
 *
 * Each of these is enforced by code and also stated in text the customer
 * reads. Holding them here lets the wording be built from the same value the
 * logic uses, so changing a rule cannot leave the published policy describing
 * the old one.
 *
 * The policy strings carry placeholders — `{threshold}`, `{days}`, `{hours}` —
 * which are filled in at render from the constants below.
 */

/** Order subtotal, before any discount, at which standard shipping is free. */
export const FREE_SHIPPING_THRESHOLD = 200;

/** Hours after an order is placed during which the customer may cancel it. */
export const CANCEL_WINDOW_HOURS = 24;

/** Days after delivery during which a return may be requested. */
export const RETURN_WINDOW_DAYS = 7;

/**
 * Shekels taken off the total per loyalty point redeemed.
 *
 * A point is earned per shekel spent, so at 0.05 the scheme returns 5% and
 * twenty points are worth one shekel.
 */
export const POINT_REDEMPTION_VALUE = 0.05;

/** Loyalty points that add up to one shekel, for wording that states it. */
export const POINTS_PER_SHEKEL = Math.round(1 / POINT_REDEMPTION_VALUE);

/**
 * Fills the rule numbers into a piece of policy text.
 *
 * Applied to manager-edited text as well as to the built-in wording, so a
 * placeholder typed into the settings screen resolves the same way.
 *
 * @param {string} text - Wording that may contain the placeholders.
 * @returns {string} The wording with the current numbers in place.
 */
export function withPolicyNumbers(text) {
  return String(text ?? "")
    .replaceAll("{threshold}", String(FREE_SHIPPING_THRESHOLD))
    .replaceAll("{hours}", String(CANCEL_WINDOW_HOURS))
    .replaceAll("{days}", String(RETURN_WINDOW_DAYS))
    .replaceAll("{points}", String(POINTS_PER_SHEKEL));
}
