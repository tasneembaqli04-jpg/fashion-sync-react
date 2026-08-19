/**
 * The figures above the gift card screen.
 *
 * A gift card is unusual among the things the shop sells: it is a liability
 * rather than income until it is spent, and it can be refused before it ever
 * exists. Both facts have to be reflected in the totals, and neither was.
 */

/**
 * The cards that were actually issued.
 *
 * A rejected card was never issued, so it is not one that was sold and its
 * face value is not money the shop took. Active, spent and awaiting-approval
 * cards all stand.
 *
 * @param {Array<object>} [cards] - Every gift card record.
 * @returns {Array<object>} The cards that count.
 */
export function soldGiftCards(cards = []) {
  return (Array.isArray(cards) ? cards : []).filter(
    (card) => card?.status !== "rejected",
  );
}

/**
 * The face value of every card issued.
 *
 * What was sold, which is not the same as what is still owed.
 *
 * @param {Array<object>} [cards] - Every gift card record.
 * @returns {number} Total face value.
 */
export function totalIssuedValue(cards = []) {
  return soldGiftCards(cards).reduce(
    (sum, card) => sum + (Number(card.amount) || 0),
    0,
  );
}

/**
 * What the shop still owes on the cards it has issued.
 *
 * A card is a liability from the moment it is paid for until it is spent, and
 * a card spent across several orders leaves part of itself outstanding. The
 * face value says what was sold; this says what is still to be honoured.
 *
 * @param {Array<object>} [cards] - Every gift card record.
 * @returns {number} Total unspent balance.
 */
export function openGiftCardBalance(cards = []) {
  return soldGiftCards(cards).reduce(
    (sum, card) => sum + (Number(card.balance) || 0),
    0,
  );
}
