import { db } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";

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