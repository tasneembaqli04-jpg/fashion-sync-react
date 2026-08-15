/**
 * Rules for a valid weekly opening schedule.
 *
 * The times are stored as "HH:MM" strings and compared as strings elsewhere in
 * the system, which only works while both are zero padded and the opening time
 * comes first. A day saved with closing before opening passes every write and
 * then quietly breaks collection booking: the customer's chosen time is
 * checked with `time >= openTime && time <= closeTime`, which no time can
 * satisfy, so every slot is refused with no indication of why.
 *
 * Validating on save keeps that from reaching Firestore at all.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Whether a string is a real 24-hour time.
 *
 * The pattern bounds the hours and minutes as well as the shape, so "99:99"
 * is rejected rather than accepted and compared as text.
 *
 * @param {*} value - The value to test.
 * @returns {boolean} true for a valid "HH:MM".
 */
export function isValidTime(value) {
  return TIME_PATTERN.test(String(value || ""));
}

/**
 * Checks a week of opening hours.
 *
 * Days marked closed are skipped: their times are irrelevant and are often
 * left at whatever they were.
 *
 * @param {Array<object>} days - The weekly schedule.
 * @param {object} [messages] - Wording for each failure.
 * @param {object} [dayNames] - Day key to display name.
 * @returns {string} An empty string when the schedule is valid, otherwise the
 * message to show.
 */
export function validateBusinessHours(days, messages = {}, dayNames = {}) {
  const schedule = Array.isArray(days) ? days : [];

  for (const day of schedule) {
    if (!day?.open) continue;

    const name = dayNames[day.key] || day.key;

    if (!isValidTime(day.openTime) || !isValidTime(day.closeTime)) {
      return (messages.invalidTime || "{day}").replace("{day}", name);
    }

    if (day.openTime >= day.closeTime) {
      return (messages.closeBeforeOpen || "{day}")
        .replace("{day}", name)
        .replace("{open}", day.openTime)
        .replace("{close}", day.closeTime);
    }
  }

  return "";
}
