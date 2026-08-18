/**
 * Showing a long list a part at a time.
 *
 * Several management screens render every record they hold. That was
 * workable while the shop was new and stops being workable exactly when the
 * shop succeeds, which is the wrong moment for a screen to become unusable.
 *
 * The alternative already in the code is a fixed cap — the overview showed
 * the first six alerts and the first fifteen slow movers — but a cap that
 * says nothing about what it dropped is worse than a long list: it looks
 * complete. Everything here is built so the screen can always say how much
 * is left rather than quietly stopping.
 *
 * The arithmetic lives here rather than in the hook because a hook cannot be
 * unit tested in this project, and this is the part worth testing.
 */

/** Records shown before anything is expanded, on a full-width list. */
export const DEFAULT_INITIAL = 15;

/** Records added by one press. */
export const DEFAULT_STEP = 15;

/**
 * The records to render.
 *
 * @param {Array<*>} items - Every record that passed the screen's filters.
 * @param {number} count - How many are currently revealed.
 * @returns {Array<*>} The leading slice, never longer than the list.
 */
export function visibleSlice(items, count) {
  const list = Array.isArray(items) ? items : [];
  const safeCount = Math.max(0, Number(count) || 0);

  return list.slice(0, safeCount);
}

/**
 * How many records are still hidden.
 *
 * This is the number the button shows. A press that reveals an unknown
 * quantity is the silent truncation problem in another form.
 *
 * @param {Array<*>} items - Every record that passed the screen's filters.
 * @param {number} count - How many are currently revealed.
 * @returns {number} Records not yet shown, never negative.
 */
export function remainingCount(items, count) {
  const list = Array.isArray(items) ? items : [];
  const safeCount = Math.max(0, Number(count) || 0);

  return Math.max(0, list.length - safeCount);
}

/**
 * Whether there is anything left to reveal.
 *
 * @param {Array<*>} items - Every record that passed the screen's filters.
 * @param {number} count - How many are currently revealed.
 * @returns {boolean} Whether the button should be offered at all.
 */
export function hasMore(items, count) {
  return remainingCount(items, count) > 0;
}

/**
 * The count after one press.
 *
 * Clamped to the length of the list, so the stored count cannot drift above
 * what exists and leave the button promising records that are not there.
 *
 * @param {number} count - How many are currently revealed.
 * @param {number} step - How many one press adds.
 * @param {number} total - Records available.
 * @returns {number} The next count.
 */
export function nextCount(count, step, total) {
  const safeCount = Math.max(0, Number(count) || 0);
  const safeStep = Math.max(1, Number(step) || DEFAULT_STEP);
  const safeTotal = Math.max(0, Number(total) || 0);

  return Math.min(safeTotal, safeCount + safeStep);
}
