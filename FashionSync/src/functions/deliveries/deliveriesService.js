import { db } from "../../backend/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";

const deliveriesCollection = collection(db, "deliveries");

const STEPS = ["אושרה", "בהכנה", "נשלחה", "נמסרה"];

export async function getAllDeliveries() {
  const snapshot = await getDocs(deliveriesCollection);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function addDelivery(delivery) {
  const statusIndex = typeof delivery.status === "number" ? delivery.status : 1;
  await setDoc(doc(db, "deliveries", delivery.id), {
    ...delivery,
    statusLabel: STEPS[statusIndex] || "",
  });
}

export async function updateDeliveryStatus(deliveryId, status) {
  await setDoc(
    doc(db, "deliveries", deliveryId),
    { status, statusLabel: STEPS[status] || "" },
    { merge: true }
  );
}

export async function deleteDelivery(deliveryId) {
  await deleteDoc(doc(db, "deliveries", deliveryId));
}