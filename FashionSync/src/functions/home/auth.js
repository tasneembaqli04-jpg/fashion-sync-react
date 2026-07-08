import { signIn, signUp } from "../../backend/services/auth/firebaseAuth.js";
import { saveAuthUser, CUSTOMER_PAGE } from "./storage.js";

export function isGmail(email) {
  return /^[a-z0-9._%+-]+@gmail\.com$/.test(
    String(email || "").trim().toLowerCase()
  );
}

export async function loginOrCreateUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPass = password.trim();

  if (!isGmail(normalizedEmail)) {
    return { error: "אימייל לא תקין — חייב להיות ‎@gmail.com" };
  }

  if (normalizedPass.length < 8) {
    return { error: "הסיסמה חייבת להכיל לפחות 8 תווים" };
  }

  let result = await signIn(normalizedEmail, normalizedPass);

  if (result.error === "אימייל או סיסמה שגויים") {
    result = await signUp(normalizedEmail, normalizedPass);
  }

  if (result.error) {
    return result;
  }

  saveAuthUser(result.user);

  return {
    user: result.user,
    redirectUrl: `${CUSTOMER_PAGE}?mode=auth&email=${encodeURIComponent(
      result.user.email
    )}&name=${encodeURIComponent(result.user.name)}`,
  };
}