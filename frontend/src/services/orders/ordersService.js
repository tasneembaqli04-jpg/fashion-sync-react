import { db } from "../../firebase";
import { saveCustomer, addLoyaltyPoints } from "../customer/customerFirestore";
import { issueGiftCard } from "../giftcard/giftCardService";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

const ordersCollection = collection(db, "orders");

const STEPS = ["אושרה", "בהכנה", "נשלחה", "נמסרה"];
const PICKUP_STEPS = ["אושרה", "בהכנה", "מוכן לאיסוף", "נאסף"];

function getStepLabels(isPickup) {
  return isPickup ? PICKUP_STEPS : STEPS;
}

export { getStepLabels };

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
    subtotal: Number(receipt.subtotal) || 0,
    discountAmount: Number(receipt.discountAmount) || 0,
    pointsRedeemed: Number(receipt.pointsRedeemed) || 0,
    pointsDiscountAmount: Number(receipt.pointsDiscountAmount) || 0,
    discountPct: Number(receipt.discountPct) || 0,
    shippingCost: Number(receipt.shippingCost) || 0,
    total: Number(receipt.total) || 0,
    installments: Number(receipt.installments) || 1,
    status: 0,
    statusLabel: STEPS[0],
    confirmed: false,
    ready: false,
    steps: getStepLabels(receipt.shipping?.id === "pickup"),
    payMethod: receipt.payMethod || "",
    shipping: receipt.shipping || null,
    pickupDate: receipt.pickupDate || "",
    pickupTime: receipt.pickupTime || "",
    createdAt: new Date().toISOString(),
  };

  await addDoc(ordersCollection, order);
  if (!order.items.every((item) => item.isGiftCard)) {
    await addLoyaltyPoints(customerEmail, order.total);
  }

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

  const orders = snapshot.docs.map((document) => ({
    docId: document.id,
    ...document.data(),
  }));

  return orders.sort((a, b) => new Date(a.date) - new Date(b.date));
}
export function subscribeToOrders(onUpdate) {
  return onSnapshot(ordersCollection, (snapshot) => {
    const orders = snapshot.docs.map((document) => ({
      docId: document.id,
      ...document.data(),
    }));

    onUpdate(orders.sort((a, b) => new Date(a.date) - new Date(b.date)));
  });
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

export async function updateOrderItems(docId, items) {
  const orderRef = doc(db, "orders", docId);
  await updateDoc(orderRef, { items });
}
export async function setPickupSchedule(docId, pickupDate, pickupTime) {
  if (!pickupDate || !pickupTime) {
    throw new Error("pickupDate and pickupTime are required");
  }
  const orderRef = doc(db, "orders", docId);
  await updateDoc(orderRef, { pickupDate, pickupTime });
}
export async function cancelOrder(docId) {
  const orderRef = doc(db, "orders", docId);
  await updateDoc(orderRef, {
    cancelled: true,
    cancelledAt: new Date().toISOString(),
  });
}

export async function advanceOrderStatus(docId, statusIndex, isPickup = false) {
  const orderRef = doc(db, "orders", docId);
  const payload = {
    status: statusIndex,
    statusLabel: getStepLabels(isPickup)[statusIndex] || "",
  };

  if (statusIndex === 3) {
    payload.deliveredAt = new Date().toISOString();
  }

  await updateDoc(orderRef, payload);
}
export async function confirmOrder(docId) {
  const orderRef = doc(db, "orders", docId);
  await updateDoc(orderRef, {
    confirmed: true,
  });
}