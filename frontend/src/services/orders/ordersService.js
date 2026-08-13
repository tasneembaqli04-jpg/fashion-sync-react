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

const STEPS = ["התקבלה", "בהכנה", "נשלחה", "נמסרה"];
const PICKUP_STEPS = ["התקבלה", "בהכנה", "מוכן לאיסוף", "נאסף"];

function getStepLabels(isPickup) {
  return isPickup ? PICKUP_STEPS : STEPS;
}

export { getStepLabels };

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Writes a completed order to Firestore and runs the side effects that go
 * with it.
 *
 * Beyond creating the order document this also saves the customer profile,
 * awards loyalty points, and issues a giftCards document for every gift card
 * in the basket. The steps run in sequence and are not wrapped in a
 * transaction, so a failure part way through can leave an order without its
 * points or gift cards. Moving the whole flow to a cloud function is the
 * planned fix.
 *
 * Loyalty points are awarded only when the order contains something other than
 * gift cards, so buying a gift card cannot earn points that are then spent on
 * the same purchase.
 *
 * Order items are stored as a snapshot of the cart at purchase time, including
 * the English name and colour, so the order can be rendered in either language
 * later even if the catalogue changes.
 *
 * @param {object} receipt - The completed checkout receipt.
 * @returns {Promise<void>}
 */
export async function addOrder(receipt) {
  await saveCustomer(receipt.customer);

  const customerEmail = normalizeEmail(receipt.customer?.email);

  const order = {
    id: receipt.id,
    customerEmail,
    customer: receipt.customer || null,
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
      recipientNameEn: item.giftRecipientEn || "",
      message: item.giftMessage || "",
      messageEn: item.giftMessageEn || "",
      status: "pending",
    });
  }

  return order;
}

/**
 * Loads every order belonging to one customer.
 *
 * The query filters on customerEmail, which is exactly what the Firestore
 * rules require for a customer to list orders at all. A broader query is
 * rejected outright rather than silently filtered.
 *
 * @param {string} email - Customer email.
 * @returns {Promise<Array<object>>} The orders, each carrying its docId.
 */
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
export async function updateOrderCustomerAndItems(docId, customer, items) {
  const orderRef = doc(db, "orders", docId);
  const updates = {};
  if (customer) updates.customer = customer;
  if (items) updates.items = items;
  await updateDoc(orderRef, updates);
}
/**
 * Stores the pickup date and time chosen by the customer.
 *
 * This is one of only two writes a customer is allowed to make on an order;
 * see the orders rule in firestore.rules. Both values are required, so a
 * half-filled schedule is never written.
 *
 * @param {string} docId - Firestore document id of the order.
 * @param {string} pickupDate - Chosen pickup date.
 * @param {string} pickupTime - Chosen pickup time.
 * @returns {Promise<void>}
 * @throws {Error} When either value is missing.
 */
export async function setPickupSchedule(docId, pickupDate, pickupTime) {
  if (!pickupDate || !pickupTime) {
    throw new Error("pickupDate and pickupTime are required");
  }
  const orderRef = doc(db, "orders", docId);
  await updateDoc(orderRef, { pickupDate, pickupTime });
}
/**
 * Marks an order as cancelled.
 *
 * Cancelling never deletes the document: the order is kept with a cancelled
 * flag so it stays visible in the order history and in manager reports.
 * Whether cancelling is still permitted is decided earlier by canCancelOrder
 * (the 24 hour window); this function only records the outcome.
 *
 * Restocking the items is a separate step performed by the caller.
 *
 * @param {string} docId - Firestore document id of the order.
 * @returns {Promise<void>}
 */
export async function cancelOrder(docId) {
  const orderRef = doc(db, "orders", docId);
  await updateDoc(orderRef, {
    cancelled: true,
    cancelledAt: new Date().toISOString(),
  });
}

/**
 * Moves an order to a given delivery stage.
 *
 * The human-readable label depends on whether the order is delivered or
 * collected in store, so the two flows show different wording for the same
 * stage index. Reaching the final stage also stamps deliveredAt, which is what
 * starts the 7 day return window measured by canRequestReturn.
 *
 * @param {string} docId - Firestore document id of the order.
 * @param {number} statusIndex - Target stage (0-3).
 * @param {boolean} [isPickup=false] - Whether the order is collected in store.
 * @returns {Promise<void>}
 */
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
    statusLabel: "אושרה",
  });
}
export async function rejectOrder(docId) {
  const orderRef = doc(db, "orders", docId);
  await updateDoc(orderRef, {
    rejected: true,
    rejectedAt: new Date().toISOString(),
    statusLabel: "נדחתה",
  });
}