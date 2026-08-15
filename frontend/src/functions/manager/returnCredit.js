import { he } from "../../translations/he";
import { en } from "../../translations/en";

/**
 * Builds the note stored on the credit issued for an approved return.
 *
 * This text is written by the manager but read by the customer, which is why
 * it is built in both languages rather than in the language whichever of them
 * happens to be using. Storing one language would freeze the note to the
 * writer's setting, and the reader can switch hers at any time afterwards.
 *
 * The item name is supplied in both languages for the same reason. An order
 * line carries `name` and `nameEn`, so each sentence is built with the name
 * that belongs to it. Where a line has no English name the Hebrew one is used,
 * which keeps the sentence readable rather than leaving a gap in it.
 *
 * @param {string} itemName - Item name in Hebrew, as stored on the return.
 * @param {string} [itemNameEn] - Item name in English, when the line has one.
 * @returns {{message: string, messageEn: string}} The note in both languages.
 */
export function buildReturnCreditMessage(itemName, itemNameEn) {
  const hebrewName = itemName || he.manager.returns.creditFallbackItem;
  const englishName =
    itemNameEn || itemName || en.manager.returns.creditFallbackItem;

  return {
    message: he.manager.returns.creditMessage.replace("{item}", hebrewName),
    messageEn: en.manager.returns.creditMessage.replace("{item}", englishName),
  };
}
