/**
 * Money helpers.
 *
 * Shekel amounts are held as JavaScript numbers, and neither 0.05 nor 0.1 has
 * an exact binary representation. A chain such as
 * 249.90 + 2 × 89.90 − 143 × 0.05 lands on 386.70000000000005 rather than
 * 386.70, and that value is what would reach Firestore and every later
 * comparison.
 *
 * The rule this module exists to support: compute the whole chain at full
 * precision, then round once, at the point the amount is written or compared.
 * Rounding intermediate steps would accumulate its own error.
 *
 * The module deliberately has no imports, so both the service layer and the
 * business-logic layer can use it without inverting the dependency direction.
 */

const CENTS = 100;

/**
 * Rounds an amount to two decimal places.
 *
 * The relative nudge before rounding decides genuine half-way ties upward.
 * Without it, 1.005 rounds down, because 1.005 × 100 evaluates to
 * 100.49999999999999.
 *
 * @param {*} value - Amount to round. Non-numeric input yields 0.
 * @returns {number} The amount to two decimal places.
 */
export function roundMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(amount * (1 + Number.EPSILON) * CENTS) / CENTS;
}

/**
 * Splits a total into instalments that add back up to exactly that total.
 *
 * Every instalment but the last carries the rounded share; the last one
 * absorbs the remainder. Rounding each instalment independently would let the
 * sum drift away from the amount the customer actually owes.
 *
 * @param {number} total - Amount to split.
 * @param {number} count - Number of instalments.
 * @returns {{regular: number, last: number, isUniform: boolean}}
 * The repeated instalment, the final instalment, and whether they are equal.
 */
export function splitInstallments(total, count) {
  const amount = roundMoney(total);
  const parts = Math.max(1, Math.trunc(Number(count) || 1));

  if (parts === 1) {
    return { regular: amount, last: amount, isUniform: true };
  }

  const regular = roundMoney(amount / parts);
  const last = roundMoney(amount - regular * (parts - 1));

  return { regular, last, isUniform: regular === last };
}
