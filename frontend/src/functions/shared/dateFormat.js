/**
 * Date display, shared by every screen that shows one.
 *
 * Twelve screens each carried their own `fmtDate`, and the customer's screens
 * carried none at all — which is why "ההזמנות שלי" printed a raw ISO string.
 * The formatting lives here so every screen reads the same, and so the guard
 * against an unusable value is written once.
 *
 * Two shapes are offered, because the screens genuinely need both: a list
 * entry says when something happened to the minute, while an order line wants
 * the day alone. `fullYear` covers the receipt and order documents, which
 * print 2026 rather than 26.
 */

/**
 * The locale to format in, for a language code.
 *
 * @param {string} lang - "en" or "he".
 * @returns {string} A BCP 47 locale tag.
 */
export function localeFor(lang) {
  return lang === "en" ? "en-US" : "he-IL";
}

/**
 * Builds the options object shared by both formatters.
 *
 * @param {boolean} fullYear - Whether to print four digits of year.
 * @returns {object} Intl date options.
 */
function dateParts(fullYear) {
  return {
    day: "2-digit",
    month: "2-digit",
    year: fullYear ? "numeric" : "2-digit",
  };
}

/**
 * A date and time, in the reader's language.
 *
 * @param {*} value - A date value in any form `Date` accepts.
 * @param {string} lang - "en" or "he".
 * @param {object} [options] - Display options.
 * @param {boolean} [options.fullYear] - Print four digits of year.
 * @returns {string} The formatted value, or an empty string when unreadable.
 */
export function formatDateTime(value, lang, { fullYear = false } = {}) {
  // Guarded before parsing for the same reason as getMonthKey: `new Date(null)`
  // is the epoch, not an invalid date, so an empty field would print as
  // 01/01/70 rather than as nothing.
  if (value === null || value === undefined || value === "") return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(localeFor(lang), {
    ...dateParts(fullYear),
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A date without the time, in the reader's language.
 *
 * @param {*} value - A date value in any form `Date` accepts.
 * @param {string} lang - "en" or "he".
 * @param {object} [options] - Display options.
 * @param {boolean} [options.fullYear] - Print four digits of year.
 * @returns {string} The formatted value, or an empty string when unreadable.
 */
export function formatDate(value, lang, { fullYear = false } = {}) {
  if (value === null || value === undefined || value === "") return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(localeFor(lang), dateParts(fullYear));
}
