import { db } from "../../backend/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

export async function issueGiftCard({ code, amount, buyerEmail, recipientName, message }) {
  const giftCardCode = normalizeCode(code);
  if (!giftCardCode) return;

  await setDoc(doc(db, "giftCards", giftCardCode), {
    code: giftCardCode,
    amount: Number(amount) || 0,
    balance: Number(amount) || 0,
    buyerEmail: buyerEmail || "",
    recipientName: recipientName || "",
    message: message || "",
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