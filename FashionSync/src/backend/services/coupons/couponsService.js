import { db } from "../../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  addDoc,
  query,
  where,
} from "firebase/firestore";

const couponsCollection = collection(db, "coupons");
const couponUsageCollection = collection(db, "couponUsage");

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

export async function getAllCoupons() {
  const snapshot = await getDocs(couponsCollection);
  return snapshot.docs.map((document) => ({
    code: document.id,
    ...document.data(),
  }));
}

export async function getCoupon(code) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;

  const snapshot = await getDoc(doc(db, "coupons", normalizedCode));
  return snapshot.exists() ? { code: normalizedCode, ...snapshot.data() } : null;
}

export async function addCoupon({ code, discount, seasonOnly = null, active = true }) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) throw new Error("קוד קופון חסר");

  await setDoc(doc(db, "coupons", normalizedCode), {
    discount: Number(discount) || 0,
    type: "percent",
    active: Boolean(active),
    seasonOnly: seasonOnly || null,
    createdAt: new Date().toISOString(),
  });
}

export async function updateCoupon(code, updates) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return;

  await setDoc(doc(db, "coupons", normalizedCode), updates, { merge: true });
}

export async function deleteCoupon(code) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return;

  await deleteDoc(doc(db, "coupons", normalizedCode));
}

export async function logCouponUsage({ code, email, orderId, discountAmount }) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return;

  await addDoc(couponUsageCollection, {
    code: normalizedCode,
    email: String(email || "").trim().toLowerCase(),
    orderId: orderId || "",
    discountAmount: Number(discountAmount) || 0,
    usedAt: new Date().toISOString(),
  });
}

export async function getCouponUsage(code) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return [];

  const q = query(couponUsageCollection, where("code", "==", normalizedCode));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function getAllCouponUsage() {
  const snapshot = await getDocs(couponUsageCollection);
  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}