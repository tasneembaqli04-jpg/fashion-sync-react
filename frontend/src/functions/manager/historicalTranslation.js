/**
 * Decides which stored records still need an English translation.
 *
 * Only the decisions live here, not the Firestore writes. That split is the
 * point: which records are outstanding, and how many, is ordinary logic over
 * plain objects and can be tested directly, while the sweep that writes them
 * back stays in the screen that owns the progress bar.
 *
 * Two different questions are being asked, and answering them with one rule is
 * what made the counter misbehave before:
 *
 * - **Translated text** is outstanding when the English field is empty, and
 *   also when it came back identical to the Hebrew, which is what a failed
 *   translation looks like once it has been stored.
 * - **A person's name** is never translated at all; its English field mirrors
 *   the name. Identical values are therefore the finished state, and only an
 *   empty field is outstanding. Judged by the first rule, every customer name
 *   in the shop would be reported as failing for ever.
 */

/**
 * Whether a translated field still needs work.
 *
 * @param {string} original - The Hebrew value.
 * @param {string} translated - The stored English value.
 * @returns {boolean} true when the field is missing or came back untranslated.
 */
export function needsTranslation(original, translated) {
  if (!original) return false;
  if (!translated) return true;
  return translated.trim() === original.trim();
}

/**
 * Whether a person's name still needs its English field filled in.
 *
 * @param {string} original - The name.
 * @param {string} translated - The stored English value.
 * @returns {boolean} true only while the English field is empty.
 */
export function needsPersonNameFill(original, translated) {
  return Boolean(original) && !translated;
}

/**
 * Counts the outstanding fields on one order.
 *
 * @param {object} order - The order.
 * @returns {number} How many fields are outstanding.
 */
export function countOrderGaps(order) {
  let count = 0;

  for (const item of order?.items || []) {
    if (needsTranslation(item.name, item.nameEn)) count += 1;

    if (item.isGiftCard) {
      if (needsPersonNameFill(item.giftRecipient, item.giftRecipientEn)) count += 1;
      if (needsTranslation(item.giftMessage, item.giftMessageEn)) count += 1;
    }
  }

  const customer = order?.customerEmbedded || order?.customerDetails;

  if (customer) {
    if (needsPersonNameFill(customer.name, customer.nameEn)) count += 1;
    if (needsTranslation(customer.city, customer.cityEn)) count += 1;
    if (needsTranslation(customer.street, customer.streetEn)) count += 1;
  }

  return count;
}

/**
 * Counts the outstanding fields on one contact message.
 *
 * @param {object} message - The message.
 * @returns {number} How many fields are outstanding.
 */
export function countMessageGaps(message) {
  let count = 0;

  if (needsPersonNameFill(message?.name, message?.nameEn)) count += 1;
  if (needsTranslation(message?.message, message?.messageEn)) count += 1;

  return count;
}

/**
 * Counts the outstanding fields on one feedback entry.
 *
 * @param {object} entry - The feedback entry.
 * @returns {number} How many fields are outstanding.
 */
export function countFeedbackGaps(entry) {
  return needsTranslation(entry?.text, entry?.textEn) ? 1 : 0;
}

/**
 * Counts the outstanding fields on one customer record.
 *
 * @param {object} customer - The customer.
 * @returns {number} How many fields are outstanding.
 */
export function countCustomerGaps(customer) {
  let count = 0;

  if (needsPersonNameFill(customer?.name, customer?.nameEn)) count += 1;
  if (needsTranslation(customer?.city, customer?.cityEn)) count += 1;
  if (needsTranslation(customer?.street, customer?.streetEn)) count += 1;

  return count;
}

/**
 * Counts the outstanding fields on one product, including its colours.
 *
 * @param {object} product - The product.
 * @returns {number} How many fields are outstanding.
 */
export function countProductGaps(product) {
  let count = 0;

  if (needsTranslation(product?.name, product?.nameEn)) count += 1;
  if (needsTranslation(product?.desc, product?.descEn)) count += 1;

  for (const variant of product?.variants || []) {
    if (needsTranslation(variant.colorName, variant.colorNameEn)) count += 1;
  }

  return count;
}

/**
 * Counts every outstanding field across the shop.
 *
 * This is the figure shown on the settings card and on the sidebar badge, so
 * it counts fields rather than records: a product missing both its name and
 * its description is two pieces of work, not one.
 *
 * @param {object} [data] - The records to examine.
 * @returns {number} The total number of outstanding fields.
 */
export function countOutstandingTranslations({
  orders = [],
  contactMessages = [],
  feedback = [],
  customers = [],
  products = [],
} = {}) {
  return (
    orders.reduce((sum, order) => sum + countOrderGaps(order), 0) +
    contactMessages.reduce((sum, message) => sum + countMessageGaps(message), 0) +
    feedback.reduce((sum, entry) => sum + countFeedbackGaps(entry), 0) +
    customers.reduce((sum, customer) => sum + countCustomerGaps(customer), 0) +
    products.reduce((sum, product) => sum + countProductGaps(product), 0)
  );
}

/**
 * Picks out the records the sweep has to visit.
 *
 * Records rather than fields: the sweep updates a whole document at a time,
 * and the progress bar counts documents.
 *
 * @param {object} [data] - The records to examine.
 * @returns {{orders: object[], messages: object[], feedback: object[], customers: object[], products: object[], total: number}}
 * The records needing an update, and how many there are altogether.
 */
export function selectRecordsNeedingTranslation({
  orders = [],
  contactMessages = [],
  feedback = [],
  customers = [],
  products = [],
} = {}) {
  const selected = {
    orders: orders.filter((order) => countOrderGaps(order) > 0),
    messages: contactMessages.filter((message) => countMessageGaps(message) > 0),
    feedback: feedback.filter((entry) => countFeedbackGaps(entry) > 0),
    customers: customers.filter((customer) => countCustomerGaps(customer) > 0),
    products: products.filter((product) => countProductGaps(product) > 0),
  };

  return {
    ...selected,
    total:
      selected.orders.length +
      selected.messages.length +
      selected.feedback.length +
      selected.customers.length +
      selected.products.length,
  };
}
