import { db } from "../../firebase";
import { collection, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";

const deliveriesCollection = collection(db, "deliveries");

export async function getAllDeliveries() {
  const snapshot = await getDocs(deliveriesCollection);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function addDelivery(delivery) {
  await setDoc(doc(db, "deliveries", delivery.id), delivery);
}

export async function updateDeliveryStatus(deliveryId, status) {
  await setDoc(doc(db, "deliveries", deliveryId), { status }, { merge: true });
}

export async function deleteDelivery(deliveryId) {
  await deleteDoc(doc(db, "deliveries", deliveryId));
}