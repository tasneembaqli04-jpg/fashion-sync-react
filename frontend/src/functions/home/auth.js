import { signIn, signUp } from "../../services/auth/firebaseAuth.js";
import { auth } from "../../firebase.js";
import { setPersistence, browserLocalPersistence } from "firebase/auth";
import { saveAuthUser, CUSTOMER_PAGE } from "./storage.js";
import {
  createAndSendVerificationCode,
  isEmailVerified,
} from "../../services/verification/verificationService.js";

export function isGmail(email) {
  return /^[a-z0-9._%+-]+@gmail\.com$/.test(
    String(email || "").trim().toLowerCase()
  );
}

export async function loginOrCreateUser(email, password, t, lang) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPass = password.trim();

  if (!isGmail(normalizedEmail)) {
    return { error: t.invalidGmail };
  }

  if (normalizedPass.length < 8) {
    return { error: t.passwordTooShort };
  }

  // Customer sessions survive a browser restart. This is stated explicitly
  // rather than relying on the Firebase default, because the management login
  // narrows the same auth instance to session-only persistence. Without this
  // line, a customer signing in from the same tab after a manager login would
  // inherit that narrower setting and be signed out when the browser closes.
  //
  // Both signIn and signUp below are covered: persistence applies to the auth
  // instance, so it only needs setting once ahead of them.
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (err) {
    console.error("Could not set customer session persistence:", err);
  }

  let result = await signIn(normalizedEmail, normalizedPass, t);
  let isNewSignup = false;

  if (
    result.errorCode === "auth/wrong-password" ||
    result.errorCode === "auth/invalid-credential"
  ) {
    result = await signUp(normalizedEmail, normalizedPass, t);
    isNewSignup = true;
  }

  if (result.error) {
    return result;
  }

  if (isNewSignup || !(await isEmailVerified(normalizedEmail))) {
    await createAndSendVerificationCode(normalizedEmail, result.user.name, lang);

    return {
      needsVerification: true,
      email: normalizedEmail,
      name: result.user.name,
      pendingUser: result.user,
    };
  }

  saveAuthUser(result.user);

  return {
    user: result.user,
    redirectUrl: `${CUSTOMER_PAGE}?mode=auth&email=${encodeURIComponent(
      result.user.email
    )}&name=${encodeURIComponent(result.user.name)}`,
  };
}

export function completeVerifiedLogin(user) {
  saveAuthUser(user);

  return `${CUSTOMER_PAGE}?mode=auth&email=${encodeURIComponent(
    user.email
  )}&name=${encodeURIComponent(user.name)}`;
}