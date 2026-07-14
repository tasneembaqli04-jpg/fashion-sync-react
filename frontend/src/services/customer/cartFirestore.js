import { db } from "../../firebase";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function saveCartToFirestore(email, cart) {
  const customerEmail = normalizeEmail(email);

  if (!customerEmail) {
    throw new Error("Customer email is missing");
  }

  await setDoc(
    doc(db, "carts", customerEmail),
    {
      customerEmail,
      items: Array.isArray(cart) ? cart : [],
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function getCartFromFirestore(email) {
  const customerEmail = normalizeEmail(email);

  if (!customerEmail) {
    return [];
  }

  const snapshot = await getDoc(doc(db, "carts", customerEmail));

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.data();
  return Array.isArray(data.items) ? data.items : [];
}

export async function clearCartFromFirestore(email) {
  const customerEmail = normalizeEmail(email);

  if (!customerEmail) {
    return;
  }

  await deleteDoc(doc(db, "carts", customerEmail));
}