/**
 * Date helpers shared by the order policies and the management screens.
 *
 * The module deliberately has no imports, so any layer can use it.
 */

/**
 * Resolves the first usable timestamp from a list of candidate date values.
 *
 * A plain `a || b` chain is not enough for two reasons:
 *
 * 1. `new Date(null)` is not an invalid date. It evaluates to the epoch, so a
 *    null date field silently reads as 1 January 1970 and every elapsed-time
 *    check treats the record as ancient.
 * 2. `||` only falls through on a falsy value. A candidate that is present but
 *    unparseable ("not a date") wins the chain and then yields NaN, with the
 *    later candidates never consulted.
 *
 * Each candidate is therefore checked for absence first and parsed second, and
 * the search continues until one of them actually produces a valid time.
 *
 * @param {...*} values - Candidate date values, in order of preference.
 * @returns {number|null} Milliseconds since the epoch, or null if none parse.
 */
export function resolveTimestamp(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    const time = new Date(value).getTime();

    if (!Number.isNaN(time)) {
      return time;
    }
  }

  return null;
}
