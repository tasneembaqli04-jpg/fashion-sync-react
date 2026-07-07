import { db } from "../../backend/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function getWishlist(email) {
  const key = normalizeEmail(email);
  if (!key) return [];

  const snapshot = await getDoc(doc(db, "wishlists", key));
  return snapshot.exists() ? snapshot.data().codes || [] : [];
}

export async function saveWishlist(email, codes) {
  const key = normalizeEmail(email);
  if (!key) return;

  await setDoc(doc(db, "wishlists", key), { codes });
}