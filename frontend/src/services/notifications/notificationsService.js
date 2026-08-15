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

const notificationsCollection = collection(db, "stockNotifications");

export async function requestStockNotification({ productCode, productName, email, phone }) {
  await addDoc(
    notificationsCollection,
    omitEmpty({
      productCode: productCode || "",
      productName: productName || "",
      email: email || "",
      phone: phone || "",
      notified: false,
      createdAt: new Date().toISOString(),
    })
  );
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