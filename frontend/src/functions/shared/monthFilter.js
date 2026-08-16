/**
 * The month filter shared by every screen that offers one.
 *
 * Nine screens each had their own copy of this, which is why the selector
 * behaved slightly differently on each. The logic lives here so they agree,
 * and so it can be tested without rendering anything.
 *
 * A filter value is one of three shapes:
 *
 *   "all"       every record
 *   "2026"      a whole year
 *   "2026-08"   one month
 *
 * The first and last are what the screens used before; the year is new and
 * exists so the month list can stay at twelve entries rather than growing by
 * one every month the shop operates.
 *
 * Which date a record is filed under is decided by the caller, which passes
 * the value to read. The screens do not all agree on that — some read `date`,
 * some `createdAt` — and this module deliberately does not settle it, so
 * moving a screen onto the shared component cannot move its records into a
 * different month.
 */

export const ALL_MONTHS = "all";

/** Returned for a record whose date is missing or unreadable. */
export const UNKNOWN_MONTH = "unknown";

/**
 * The `YYYY-MM` key a date belongs to.
 *
 * @param {*} value - A date value in any form `Date` accepts.
 * @returns {string} The key, or UNKNOWN_MONTH when it cannot be read.
 */
export function getMonthKey(value) {
  // Guarded before parsing, because `new Date(null)` is not an invalid date:
  // it is the epoch. Without this a record with no date is filed under
  // January 1970, which the nine separate copies of this function all did —
  // putting a 1970 entry in the selector and a record in a month it has no
  // claim to.
  if (value === null || value === undefined || value === "") {
    return UNKNOWN_MONTH;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return UNKNOWN_MONTH;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * The year part of a filter value or month key.
 *
 * @param {string} key - A filter value or month key.
 * @returns {string} The year, or an empty string when there is none.
 */
export function getYearPart(key) {
  if (!key || key === ALL_MONTHS || key === UNKNOWN_MONTH) return "";

  return String(key).split("-")[0];
}

/**
 * The month part of a filter value, as `MM`.
 *
 * @param {string} key - A filter value or month key.
 * @returns {string} The month, or an empty string for a whole year.
 */
export function getMonthPart(key) {
  if (!key || key === ALL_MONTHS || key === UNKNOWN_MONTH) return "";

  return String(key).split("-")[1] || "";
}

/**
 * Whether a record's date falls inside the selected filter.
 *
 * Replaces the `getMonthKey(record.date) === monthFilter` comparison the
 * screens used, which could only express "all" or one exact month.
 *
 * @param {string} filterValue - "all", "YYYY", or "YYYY-MM".
 * @param {*} dateValue - The record's date.
 * @returns {boolean} Whether the record should be shown.
 */
export function matchesMonthFilter(filterValue, dateValue) {
  if (!filterValue || filterValue === ALL_MONTHS) return true;

  const key = getMonthKey(dateValue);

  // A record with no usable date belongs to no month, so it shows only when
  // nothing is being filtered out.
  if (key === UNKNOWN_MONTH) return false;

  // A year on its own covers every month in it.
  if (!getMonthPart(filterValue)) {
    return getYearPart(key) === getYearPart(filterValue);
  }

  return key === filterValue;
}

/**
 * The years present in a set of records, newest first.
 *
 * The current year is always included, so the selector is never empty and a
 * shop with no records yet still shows the year it is in.
 *
 * @param {Array<object>} records - The records being filtered.
 * @param {Function} getDate - Reads the date value from a record.
 * @param {Date} [now] - Current date; injectable for tests.
 * @returns {string[]} Years as strings, newest first.
 */
export function availableYears(records, getDate, now = new Date()) {
  const years = new Set([String(now.getFullYear())]);

  for (const record of Array.isArray(records) ? records : []) {
    const key = getMonthKey(getDate(record));
    if (key !== UNKNOWN_MONTH) years.add(getYearPart(key));
  }

  return [...years].sort((a, b) => Number(b) - Number(a));
}
