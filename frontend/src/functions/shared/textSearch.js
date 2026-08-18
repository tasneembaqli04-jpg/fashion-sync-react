/**
 * Free-text search over fields that exist in both languages.
 *
 * Every product, and every gift card recipient, is stored under two names:
 * the Hebrew one the manager typed and the English one saved alongside it.
 * A search that reads only one of them answers only half the questions it is
 * asked, and the half it refuses is not predictable from the interface: the
 * manager knows a product by both names whatever language she is reading in,
 * and an English recipient name is a transliteration rather than a
 * translation, so "רותם" and "Rotem" are the same person spelled two ways.
 *
 * So a query is matched against every name a record has, not against the one
 * the screen happens to be showing. A search in Hebrew finds an English name
 * and the other way round.
 *
 * Deliberately no stemming here. The chatbot's Hebrew stem derivation belongs
 * to its own matcher; these fields are short names where a plain substring is
 * what a person expects from a search box.
 */

/**
 * Puts a value into the form both sides of a comparison are measured in.
 *
 * @param {*} value - Any value; missing ones become an empty string.
 * @returns {string} Trimmed, lower-cased text.
 */
export function normalizeForSearch(value) {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Whether a query appears in any of the given fields.
 *
 * Case is folded on both sides. Hebrew has no case, which is why the
 * catalogue's search worked in Hebrew while comparing raw strings and would
 * have kept failing in English even once the English name was added to it.
 *
 * @param {string} query - What was typed. An empty query matches everything,
 *   which is what a search box that has not been filled in should do.
 * @param {...*} values - The fields to look in; missing ones are skipped.
 * @returns {boolean} Whether the record should be shown.
 */
export function matchesAnySearchField(query, ...values) {
  const needle = normalizeForSearch(query);
  if (!needle) return true;

  return values.some((value) => normalizeForSearch(value).includes(needle));
}
