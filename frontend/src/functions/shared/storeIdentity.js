/**
 * What the shop is called.
 *
 * The manager can set a store name in the settings screen. It was saved and
 * loaded back and nothing read it, so editing it changed nothing anywhere —
 * a field that looks like a setting and behaves like a note to self.
 *
 * Reading it goes through here so every caller falls back the same way. An
 * empty name is normal, not an error: the field starts empty on a fresh
 * install and the manager may clear it, and neither should leave a page
 * headed by a blank space.
 */

/** Used whenever the manager has not set a name. */
export const DEFAULT_STORE_NAME = "FashionSync";

/**
 * The name to show.
 *
 * @param {object|null} storeDetails - The stored settings document.
 * @returns {string} The manager's name for the shop, or the default.
 */
export function getStoreName(storeDetails) {
  const name = String(storeDetails?.storeName || "").trim();

  return name || DEFAULT_STORE_NAME;
}
