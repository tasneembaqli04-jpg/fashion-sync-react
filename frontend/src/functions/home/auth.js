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

/**
 * Decides what to tell someone whose sign-in failed and whose sign-up then
 * failed too.
 *
 * One form serves both signing in and registering, so a failed sign-in is
 * followed by an attempt to register. Firebase reports a wrong password and an
 * unknown address with the same `auth/invalid-credential`, by design, to stop
 * the form being used to discover which addresses exist. That leaves the
 * registration attempt as the only way to tell the two apart.
 *
 * When registration comes back with `auth/email-already-in-use`, the account
 * exists and the password was wrong. Passing that message through would say so
 * outright, which both misleads the customer, who is told to sign in when she
 * already was, and confirms to anyone else that the address is registered. The
 * wrong-credentials wording is returned instead: true, since the password was
 * indeed wrong, and it names two possibilities without settling which.
 *
 * @param {string} signUpErrorCode - Code from the registration attempt.
 * @param {object} t - The home.authErrors dictionary slice.
 * @returns {string|null} Message to show, or null to keep the original.
 */
export function resolveSignUpFallbackError(signUpErrorCode, t) {
  if (signUpErrorCode === "auth/email-already-in-use") {
    return t.wrongPassword;
  }

  return null;
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
    console.warn(`Session left on the default persistence: ${err.message}`);
  }

  let result = await signIn(normalizedEmail, normalizedPass, t);
  let isNewSignup = false;

  if (
    result.errorCode === "auth/wrong-password" ||
    result.errorCode === "auth/invalid-credential"
  ) {
    result = await signUp(normalizedEmail, normalizedPass, t);
    isNewSignup = true;

    const fallbackError = resolveSignUpFallbackError(result.errorCode, t);

    if (fallbackError) {
      return { error: fallbackError, errorCode: result.errorCode };
    }
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