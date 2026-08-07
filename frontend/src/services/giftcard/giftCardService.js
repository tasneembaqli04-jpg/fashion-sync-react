import { db } from "../../firebase";
import { doc, setDoc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { translateText } from "../translation/translationService";

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

export async function issueGiftCard({ code, amount, buyerEmail, recipientName, recipientNameEn, message, messageEn }) {
  const giftCardCode = normalizeCode(code);
  if (!giftCardCode) return;

  await setDoc(doc(db, "giftCards", giftCardCode), {
    code: giftCardCode,
    amount: Number(amount) || 0,
    balance: Number(amount) || 0,
    buyerEmail: buyerEmail || "",
    recipientName: recipientName || "",
    recipientNameEn: recipientNameEn || recipientName || "",
    message: message || "",
    messageEn: messageEn || message || "",
    status: "active",
    createdAt: new Date().toISOString(),
  });
}

export async function getGiftCard(code) {
  const giftCardCode = normalizeCode(code);
  if (!giftCardCode) return null;

  const snapshot = await getDoc(doc(db, "giftCards", giftCardCode));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function redeemGiftCardAmount(code, amountToDeduct) {
  const giftCardCode = normalizeCode(code);
  const ref = doc(db, "giftCards", giftCardCode);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return { ok: false, error: "קוד כרטיס מתנה לא נמצא" };
  }

  const data = snapshot.data();

  if (data.status !== "active" || Number(data.balance) <= 0) {
    return { ok: false, error: "כרטיס המתנה כבר נוצל במלואו" };
  }

  const deducted = Math.min(Number(data.balance), Number(amountToDeduct) || 0);
  const remainingBalance = Number(data.balance) - deducted;

  await updateDoc(ref, {
    balance: remainingBalance,
    status: remainingBalance <= 0 ? "used" : "active",
  });

  return { ok: true, deducted, remainingBalance };
}
export async function getAllGiftCards() {
  const snapshot = await getDocs(collection(db, "giftCards"));
  return snapshot.docs.map((document) => document.data());
}

export async function translateGiftCard(card) {
  const code = normalizeCode(card.code);
  if (!code) return;

  const updates = {};

  if (card.recipientName && !card.recipientNameEn) {
    updates.recipientNameEn = (await translateText(card.recipientName)) || card.recipientName;
  }

  if (card.message && !card.messageEn) {
    updates.messageEn = (await translateText(card.message)) || card.message;
  }

  if (Object.keys(updates).length === 0) return;

  await updateDoc(doc(db, "giftCards", code), updates);
}