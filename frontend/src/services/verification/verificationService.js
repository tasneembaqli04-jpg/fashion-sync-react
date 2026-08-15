import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { sendVerificationCodeEmail } from "../email/emailService";

/**
 * How long a code stays usable.
 *
 * Sized against how long the email actually takes: Gmail delivery runs from
 * under a minute to about five, and a message that lands in spam is not seen
 * until the recipient goes looking. Ten minutes covers a slow delivery and a
 * spam-folder detour, and is still short enough that a code read over someone's
 * shoulder is worth little.
 */
export const CODE_TTL_MS = 10 * 60 * 1000;

/**
 * How long the previous code keeps working after a new one is issued.
 *
 * Requesting a fresh code while the first email is still in transit is common.
 * Without this window the earlier code comes back as simply wrong, which reads
 * as "you typed it incorrectly" when the truth is "that one has been replaced".
 * Keeping it recognisable for a minute lets the interface say which of the two
 * happened.
 */
export const PREVIOUS_CODE_GRACE_MS = 60 * 1000;

/**
 * Ceiling on sends per address, and the window it applies over.
 *
 * This is a courtesy limit, not a security control: the security rules let a
 * customer write her own verification document, so the counter can be reset by
 * anyone who cares to. What it does buy is the thing that actually happens by
 * accident — the send cooldown lives in component state and resets on every
 * page refresh, so a customer refreshing the page can mail herself repeatedly
 * without meaning to. The counter survives the refresh.
 */
export const MAX_SENDS_PER_WINDOW = 5;
export const SEND_WINDOW_MS = 60 * 60 * 1000;

function normalize(email) {
  return String(email || "").trim().toLowerCase();
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function verificationDocRef(email) {
  return doc(db, "emailVerifications", normalize(email));
}

/**
 * Creates a code, stores it and emails it.
 *
 * The previous code is carried over as previousCode with its own expiry, so
 * verifyCode can tell a superseded code apart from a wrong one.
 *
 * @param {string} email - Address being verified.
 * @param {string} name - Display name, used in the email body.
 * @param {string} [lang] - Interface language for the email.
 * @returns {Promise<{ok: boolean, reason?: string, retryAfterMs?: number}>}
 * Whether the code was sent, and why not when it was refused.
 */
export async function createAndSendVerificationCode(email, name, lang) {
  const normalizedEmail = normalize(email);
  const ref = verificationDocRef(normalizedEmail);
  const existing = await getDoc(ref);
  const previous = existing.exists() ? existing.data() : null;
  const now = Date.now();

  const windowStartedAt = Number(previous?.windowStartedAt) || 0;
  const windowIsOpen = now - windowStartedAt < SEND_WINDOW_MS;
  const sendCount = windowIsOpen ? Number(previous?.sendCount) || 0 : 0;

  if (windowIsOpen && sendCount >= MAX_SENDS_PER_WINDOW) {
    return {
      ok: false,
      reason: "rateLimited",
      retryAfterMs: windowStartedAt + SEND_WINDOW_MS - now,
    };
  }

  const code = generateCode();

  await setDoc(ref, {
    code,
    email: normalizedEmail,
    name: name || "",
    verified: false,
    expiresAt: now + CODE_TTL_MS,
    createdAt: now,
    // Only carried over while the earlier code has not itself expired.
    previousCode:
      previous?.code && now < Number(previous.expiresAt || 0) ? previous.code : "",
    previousCodeExpiresAt: now + PREVIOUS_CODE_GRACE_MS,
    windowStartedAt: windowIsOpen ? windowStartedAt : now,
    sendCount: sendCount + 1,
  });

  await sendVerificationCodeEmail({ toEmail: normalizedEmail, code, lang });

  return { ok: true };
}

/**
 * Issues a replacement code.
 *
 * @param {string} email - Address being verified.
 * @param {string} name - Display name.
 * @param {string} [lang] - Interface language for the email.
 * @returns {Promise<{ok: boolean, reason?: string, retryAfterMs?: number}>}
 */
export async function resendVerificationCode(email, name, lang) {
  return createAndSendVerificationCode(email, name, lang);
}

/**
 * Checks a code the customer typed.
 *
 * @param {string} email - Address being verified.
 * @param {string} inputCode - The six digits entered.
 * @returns {Promise<{ok: boolean, reason?: string}>} The outcome. `reason` is
 * one of notFound, expired, superseded or mismatch.
 */
export async function verifyCode(email, inputCode) {
  const normalizedEmail = normalize(email);
  const ref = verificationDocRef(normalizedEmail);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return { ok: false, reason: "notFound" };
  }

  const data = snapshot.data();
  const entered = String(inputCode).trim();
  const now = Date.now();

  if (entered === String(data.code)) {
    if (now > Number(data.expiresAt || 0)) {
      return { ok: false, reason: "expired" };
    }

    await setDoc(ref, { ...data, verified: true }, { merge: true });
    return { ok: true };
  }

  // Checked before the generic mismatch, so a code from the earlier email is
  // reported as replaced rather than as mistyped.
  if (
    data.previousCode &&
    entered === String(data.previousCode) &&
    now < Number(data.previousCodeExpiresAt || 0)
  ) {
    return { ok: false, reason: "superseded" };
  }

  if (now > Number(data.expiresAt || 0)) {
    return { ok: false, reason: "expired" };
  }

  return { ok: false, reason: "mismatch" };
}

/**
 * Whether the address has completed verification.
 *
 * A missing document counts as verified, which is what lets accounts created
 * before verification existed carry on signing in.
 *
 * @param {string} email - Address to check.
 * @returns {Promise<boolean>} true when no further verification is needed.
 */
export async function isEmailVerified(email) {
  const normalizedEmail = normalize(email);
  const snapshot = await getDoc(verificationDocRef(normalizedEmail));
  if (!snapshot.exists()) return true;

  return Boolean(snapshot.data().verified);
}
