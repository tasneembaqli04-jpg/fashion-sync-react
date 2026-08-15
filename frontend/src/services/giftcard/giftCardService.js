import { db } from "../../firebase";
import { doc, setDoc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { translateText, keepPersonName } from "../translation/translationService";
import { roundMoney } from "../../utils/money";

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

export async function issueGiftCard({ code, amount, buyerEmail, recipientName, recipientNameEn, message, messageEn, status = "active" }) {
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
    status,
    createdAt: new Date().toISOString(),
  });
}

export async function activateGiftCard(code) {
  const giftCardCode = normalizeCode(code);
  if (!giftCardCode) return;

  await updateDoc(doc(db, "giftCards", giftCardCode), {
    status: "active",
    activatedAt: new Date().toISOString(),
  });
}

export async function rejectGiftCard(code) {
  const giftCardCode = normalizeCode(code);
  if (!giftCardCode) return;

  await updateDoc(doc(db, "giftCards", giftCardCode), {
    status: "rejected",
    rejectedAt: new Date().toISOString(),
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

  // The deduction is clamped to the range [0, balance]. Math.max keeps a
  // negative amountToDeduct from turning the subtraction below into an
  // increase; Math.min keeps a card from paying out more than it holds.
  //
  // Both the deduction and the new balance are rounded, because they are
  // written to Firestore and because the status below compares the balance
  // against zero: an unrounded remainder such as 0.00000000001 would leave a
  // spent card marked active.
  const deducted = roundMoney(
    Math.max(0, Math.min(Number(data.balance), Number(amountToDeduct) || 0))
  );
  const remainingBalance = roundMoney(Number(data.balance) - deducted);

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

  // The recipient is a person, so the English field simply mirrors the name.
  if (card.recipientName && !card.recipientNameEn) {
    updates.recipientNameEn = keepPersonName(card.recipientName);
  }

  if (card.message && (!card.messageEn || card.messageEn.trim() === card.message.trim())) {
    const translated = await translateText(card.message);
    if (translated) updates.messageEn = translated;
  }

  if (Object.keys(updates).length === 0) return;

  await updateDoc(doc(db, "giftCards", code), updates);
}