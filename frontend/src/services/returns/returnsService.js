import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";

const returnsCollection = collection(db, "returnRequests");

export async function requestReturn({
  orderDocId,
  orderId,
  itemCode,
  itemName,
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

export async function getReturnRequestsByUser(email) {
  const all = await getAllReturnRequests();
  const normalized = String(email || "").trim().toLowerCase();
  return all.filter((r) => (r.customerEmail || "").toLowerCase() === normalized);
}

export async function updateReturnStatus(id, status) {
  await updateDoc(doc(db, "returnRequests", id), { status });
}