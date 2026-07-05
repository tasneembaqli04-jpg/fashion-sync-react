import { db } from "../../firebase";
import { saveCustomer } from "../customer/customerFirestore";
import { issueGiftCard } from "../giftcard/giftCardService";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";

const ordersCollection = collection(db, "orders");

const STEPS = ["אושרה", "בהכנה", "נשלחה", "נמסרה"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function addOrder(receipt) {
  await saveCustomer(receipt.customer);

  const customerEmail = normalizeEmail(receipt.customer?.email);

  const order = {
    id: receipt.id,
    customerEmail,
    date: receipt.date || new Date().toISOString(),
    items: receipt.items || [],
    total: Number(receipt.total) || 0,
    status: 0,
    statusLabel: STEPS[0],
    ready: false,
    steps: STEPS,
    payMethod: receipt.payMethod || "",
    shipping: receipt.shipping || null,
    createdAt: new Date().toISOString(),
  };

  await addDoc(ordersCollection, order);

  const giftCardItems = (receipt.items || []).filter((item) => item.isGiftCard);

  for (const item of giftCardItems) {
    await issueGiftCard({
      code: item.code,
      amount: item.price,
      buyerEmail: customerEmail,
      recipientName: item.giftRecipient || "",
      message: item.giftMessage || "",
    });
  }

  return order;
}

export async function getOrdersByUser(email) {
  const customerEmail = normalizeEmail(email);
  if (!customerEmail) return [];

  const q = query(
    ordersCollection,
    where("customerEmail", "==", customerEmail)
  );

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
export async function updateOrderStatus(docId, ready) {
  const orderRef = doc(db, "orders", docId);
  const statusIndex = ready ? 1 : 0;
  await updateDoc(orderRef, {
    ready: !!ready,
    status: statusIndex,
    statusLabel: STEPS[statusIndex],
  });
}

export async function advanceOrderStatus(docId, statusIndex) {
  const orderRef = doc(db, "orders", docId);
  await updateDoc(orderRef, {
    status: statusIndex,
    statusLabel: STEPS[statusIndex] || "",
  });
}