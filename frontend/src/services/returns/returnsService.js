import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  where,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

const returnsCollection = collection(db, "returnRequests");

export async function requestReturn({
  orderDocId,
  orderId,
  itemCode,
  itemName,
  itemNameEn,
  itemImg,
  qty,
  color,
  size,
  price,
  customerEmail,
  customerName,
  reason,
  reasonKey,
  note,
}) {
  await addDoc(returnsCollection, {
    orderDocId,
    orderId,
    itemCode,
    itemName,
    // Stored alongside the Hebrew name because the customer reads this record
    // back on her own orders screen, in whichever language she is using.
    itemNameEn: itemNameEn || "",
    itemImg: itemImg || "",
    qty: Number(qty) || 1,
    color: color || "",
    size: size || "",
    price: Number(price) || 0,
    customerEmail,
    customerName: customerName || "",
    reason,
    reasonKey: reasonKey || "",
    note: note || "",
    status: "pending",
    seenByCustomer: true,
    createdAt: new Date().toISOString(),
  });
}

export async function getAllReturnRequests() {
  const q = query(returnsCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function updateReturnStatus(id, status) {
  await updateDoc(doc(db, "returnRequests", id), {
    status,
    seenByCustomer: false,
  });
}

export async function markReturnSeenByCustomer(id) {
  await updateDoc(doc(db, "returnRequests", id), { seenByCustomer: true });
}

export function subscribeToReturnRequestsByUser(email, callback) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) {
    callback([]);
    return () => {};
  }

  const q = query(
    returnsCollection,
    where("customerEmail", "==", normalized),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(q, (snapshot) => {
    const all = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    callback(all);
  });
}