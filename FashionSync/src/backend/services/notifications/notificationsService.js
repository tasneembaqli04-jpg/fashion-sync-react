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
} from "firebase/firestore";

const notificationsCollection = collection(db, "stockNotifications");

export async function requestStockNotification({ productCode, productName, email, phone }) {
  await addDoc(notificationsCollection, {
    productCode: productCode || "",
    productName: productName || "",
    email: email || "",
    phone: phone || "",
    notified: false,
    createdAt: new Date().toISOString(),
  });
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

export async function deleteStockNotification(id) {
  await deleteDoc(doc(db, "stockNotifications", id));
}
export async function resolveStockNotifications(productCode) {
  const snapshot = await getDocs(notificationsCollection);

  const matches = snapshot.docs.filter(
    (d) => d.data().productCode === productCode && !d.data().notified
  );

  for (const document of matches) {
    await updateDoc(doc(db, "stockNotifications", document.id), {
      notified: true,
      resolvedAt: new Date().toISOString(),
    });
  }
}

export async function getMyStockAlerts(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return [];

  const snapshot = await getDocs(notificationsCollection);

  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(
      (item) =>
        item.email?.trim().toLowerCase() === normalizedEmail &&
        item.notified &&
        !item.seenByCustomer
    );
}

export async function markStockAlertSeen(id) {
  await updateDoc(doc(db, "stockNotifications", id), { seenByCustomer: true });
}