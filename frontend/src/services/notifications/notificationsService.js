import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { omitEmpty } from "../translation/omitEmpty";
import { alreadyWaiting } from "../../functions/customer/stockAlertPolicy";

const notificationsCollection = collection(db, "stockNotifications");

/**
 * Whether this customer is already waiting to hear about this product.
 *
 * Only unresolved requests count. A request that has already been answered is
 * kept as a record of what happened, and treating it as active would refuse a
 * customer who was told in March and wants telling again in August — she would
 * be assured she is signed up and then never hear anything.
 *
 * The query filters by email, which is what the security rules require in
 * order to allow reading the collection at all.
 *
 * @param {string} email - Customer's email address.
 * @param {string} productCode - Product she is asking about.
 * @returns {Promise<boolean>} true while an unanswered request exists.
 */
export async function hasPendingStockNotification(email, productCode) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !productCode) return false;

  const q = query(
    notificationsCollection,
    where("email", "==", normalizedEmail),
  );
  const snapshot = await getDocs(q);

  return alreadyWaiting(
    snapshot.docs.map((document) => document.data()),
    normalizedEmail,
    productCode,
  );
}

/**
 * Records a request to be told when a product is back in stock.
 *
 * Returns whether anything was written, so the caller can tell a new request
 * from a repeat one and say so rather than silently doing nothing.
 *
 * @returns {Promise<{created: boolean}>} created is false when one already exists.
 */
export async function requestStockNotification({ productCode, productName, email, phone }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  // Checked here rather than in the page, so every caller is covered and the
  // rule lives with the collection it protects.
  if (await hasPendingStockNotification(normalizedEmail, productCode)) {
    return { created: false };
  }

  await addDoc(
    notificationsCollection,
    omitEmpty({
      productCode: productCode || "",
      productName: productName || "",
      email: normalizedEmail,
      phone: phone || "",
      notified: false,
      createdAt: new Date().toISOString(),
    })
  );

  return { created: true };
}

export async function getAllStockNotifications() {
  const q = query(notificationsCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function markStockNotificationDone(id) {
  await updateDoc(doc(db, "stockNotifications", id), { notified: true });
}

/**
 * Fills in the English product name on an alert raised before the field
 * existed.
 *
 * Only that one field is written, so a sweep over old records cannot mark an
 * outstanding alert as already handled.
 *
 * @param {string} id - Stock notification document id.
 * @param {string} productNameEn - The English product name.
 * @returns {Promise<void>}
 */
export async function updateStockNotificationTranslation(id, productNameEn) {
  if (!id || !productNameEn) return;

  await updateDoc(doc(db, "stockNotifications", id), { productNameEn });
}

export async function deleteStockNotification(id) {
  await deleteDoc(doc(db, "stockNotifications", id));
}
export async function resolveStockNotifications(productCode) {
  const snapshot = await getDocs(notificationsCollection);

  const matches = snapshot.docs.filter(
    (d) => d.data().productCode === productCode && !d.data().notified
  );

  const resolvedEntries = [];

  for (const document of matches) {
    await updateDoc(doc(db, "stockNotifications", document.id), {
      notified: true,
      resolvedAt: new Date().toISOString(),
    });
    resolvedEntries.push({ id: document.id, ...document.data() });
  }

  return resolvedEntries;
}

export async function getMyStockAlerts(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return [];

  const q = query(notificationsCollection, where("email", "==", normalizedEmail));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(
      (item) =>
        item.notified &&
        !item.seenByCustomer
    );
}

export async function markStockAlertSeen(id) {
  await updateDoc(doc(db, "stockNotifications", id), { seenByCustomer: true });
}