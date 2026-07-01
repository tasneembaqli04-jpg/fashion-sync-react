import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const ordersCollection = collection(db, "orders");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function addOrder(receipt) {
  const order = {
    id: receipt.id,
    userEmail: normalizeEmail(receipt.customer?.email),
    date: receipt.date || new Date().toISOString(),
    items: receipt.items || [],
    total: Number(receipt.total) || 0,
    status: 0,
    steps: ["אושרה", "בהכנה", "נשלחה", "נמסרה"],
    payMethod: receipt.payMethod || "",
    shipping: receipt.shipping || null,
    customer: receipt.customer || null,
    createdAt: new Date().toISOString(),
  };

  await addDoc(ordersCollection, order);
  return order;
}

export async function getOrdersByUser(email) {
  const userEmail = normalizeEmail(email);
  if (!userEmail) return [];

  const q = query(ordersCollection, where("userEmail", "==", userEmail));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => ({
    docId: document.id,
    ...document.data(),
  }));
}

export async function getAllOrders() {
  const snapshot = await getDocs(ordersCollection);

  return snapshot.docs.map((document) => ({
    docId: document.id,
    ...document.data(),
  }));
}