import { signIn, signUp } from "../../services/auth/firebaseAuth.js";
import { saveAuthUser, CUSTOMER_PAGE } from "./storage.js";
import { sendWelcomeEmail } from "../../services/email/emailService.js";

export function isGmail(email) {
  return /^[a-z0-9._%+-]+@gmail\.com$/.test(
    String(email || "").trim().toLowerCase()
  );
}

export async function loginOrCreateUser(email, password, t) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPass = password.trim();

  if (!isGmail(normalizedEmail)) {
    return { error: t.invalidGmail };
  }

  if (normalizedPass.length < 8) {
    return { error: t.passwordTooShort };
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

  if (isNewSignup) {
    sendWelcomeEmail({ toEmail: result.user.email, name: result.user.name });
  }

  saveAuthUser(result.user);

  return {
    user: result.user,
    redirectUrl: `${CUSTOMER_PAGE}?mode=auth&email=${encodeURIComponent(
      result.user.email
    )}&name=${encodeURIComponent(result.user.name)}`,
  };
}