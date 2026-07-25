import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { sendVerificationCodeEmail } from "../email/emailService";

const CODE_TTL_MS = 10 * 60 * 1000; 

function normalize(email) {
  return String(email || "").trim().toLowerCase();
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function verificationDocRef(email) {
  return doc(db, "emailVerifications", normalize(email));
}

export async function createAndSendVerificationCode(email, name) {
  const normalizedEmail = normalize(email);
  const code = generateCode();

  await setDoc(verificationDocRef(normalizedEmail), {
    code,
    email: normalizedEmail,
    name: name || "",
    verified: false,
    expiresAt: Date.now() + CODE_TTL_MS,
    createdAt: Date.now(),
  });

  await sendVerificationCodeEmail({ toEmail: normalizedEmail, code });
}

export async function resendVerificationCode(email, name) {
  return createAndSendVerificationCode(email, name);
}

export async function verifyCode(email, inputCode) {
  const normalizedEmail = normalize(email);
  const ref = verificationDocRef(normalizedEmail);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return { ok: false, reason: "notFound" };
  }

  const data = snapshot.data();

  if (Date.now() > Number(data.expiresAt || 0)) {
    return { ok: false, reason: "expired" };
  }

  if (String(inputCode).trim() !== String(data.code)) {
    return { ok: false, reason: "mismatch" };
  }

  await setDoc(ref, { ...data, verified: true }, { merge: true });

  return { ok: true };
}

export async function isEmailVerified(email) {
  const normalizedEmail = normalize(email);
  const snapshot = await getDoc(verificationDocRef(normalizedEmail));
  if (!snapshot.exists()) return true;

  return Boolean(snapshot.data().verified);
}