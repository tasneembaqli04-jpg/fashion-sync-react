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