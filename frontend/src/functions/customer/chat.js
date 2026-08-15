/**
 * Reply used when the chat service cannot be reached.
 *
 * This deliberately answers nothing. It previously held around twenty scripted
 * replies covering returns, delivery, opening hours, prices and loyalty
 * points, and every figure in them was written by hand: it told customers
 * returns were accepted for 30 days while the system enforces 7, that delivery
 * was free over 350 while the threshold is 200, and quoted a loyalty balance
 * that belonged to nobody.
 *
 * Those answers could not be kept true, because nothing tied them to the
 * policies they described. The chat pipeline is built on the rule that the
 * assistant never states catalogue or policy data it cannot read; a fallback
 * that invents the same data undoes that rule precisely when the real service
 * is down and nobody is watching.
 *
 * So the fallback says only that it cannot help right now. The customer keeps
 * the policy page, which reads from the same Firestore documents the rest of
 * the system uses.
 *
 * @param {object} dict - The active language dictionary.
 * @returns {string} The message to show in the chat.
 */
export function getReply(dict) {
  return dict.customer.chat.serviceUnavailable;
}
