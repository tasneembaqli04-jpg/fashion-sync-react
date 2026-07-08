import { db } from "../../firebase";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
} from "firebase/firestore";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function saveCustomer(customer) {
  const email = normalizeEmail(customer?.email);

  if (!email) {
    throw new Error("Customer email is missing");
  }

  await setDoc(
    doc(db, "customers", email),
    {
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      name: customer.name || "",
      email,
      phone: customer.phone || "",
      street: customer.street || "",
      city: customer.city || "",
      zip: customer.zip || "",
      notes: customer.notes || "",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function getCustomer(email) {
  const customerRef = doc(db, "customers", normalizeEmail(email));
  const snapshot = await getDoc(customerRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}
export async function getLoyaltyPoints(email) {
  const customer = await getCustomer(email);
  return Number(customer?.loyaltyPoints) || 0;
}

export async function addLoyaltyPoints(email, orderTotal) {
  const customerEmail = normalizeEmail(email);
  if (!customerEmail) return;

  const customerRef = doc(db, "customers", customerEmail);
  const current = await getLoyaltyPoints(customerEmail);
  const earned = Math.round(Number(orderTotal) || 0);

  await setDoc(
    customerRef,
    { loyaltyPoints: current + earned },
    { merge: true }
  );
}
export async function getAllCustomers() {
  const snapshot = await getDocs(collection(db, "customers"));

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}