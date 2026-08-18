import { useState } from "react";
import {
  DEFAULT_INITIAL,
  DEFAULT_STEP,
  hasMore,
  nextCount,
  remainingCount,
  visibleSlice,
} from "../functions/shared/progressiveList";

/**
 * Holds how much of a long list is currently on screen.
 *
 * The arithmetic is in `functions/shared/progressiveList`, where it can be
 * tested. All this adds is the one piece of state and the rule for putting it
 * back.
 *
 * `resetKey` is what a screen passes to say its filters changed. Without it a
 * manager who pressed "load more" three times, then switched to a month with
 * four records, would be looking at a list that believes twenty are showing —
 * and, worse, at a button offering records that the new filter excludes. Every
 * screen with a month selector has that hazard, which is why the rule is
 * written once here rather than nine times.
 *
 * The reset happens during render rather than in an effect: React re-runs the
 * render with the corrected state before anything reaches the screen, so the
 * stale slice is never shown, and no second render is scheduled.
 *
 * @param {Array<*>} items - Every record that passed the screen's filters.
 * @param {object} [options] - Sizing and reset behaviour.
 * @param {number} [options.initial] - Records shown before expanding.
 * @param {number} [options.step] - Records added by one press.
 * @param {*} [options.resetKey] - Change this to collapse back to `initial`.
 * @returns {object} The slice to render, and what the button needs.
 */
export function useProgressiveList(
  items = [],
  { initial = DEFAULT_INITIAL, step = DEFAULT_STEP, resetKey = null } = {}
) {
  const [count, setCount] = useState(initial);
  const [seenResetKey, setSeenResetKey] = useState(resetKey);

  if (seenResetKey !== resetKey) {
    setSeenResetKey(resetKey);
    setCount(initial);
  }

  function showMore() {
    setCount((current) => nextCount(current, step, (items || []).length));
  }

  return {
    visible: visibleSlice(items, count),
    remaining: remainingCount(items, count),
    hasMore: hasMore(items, count),
    showMore,
  };
}
