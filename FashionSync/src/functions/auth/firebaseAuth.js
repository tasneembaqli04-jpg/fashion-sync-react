import { auth } from "../../backend/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

function friendlyError(code) {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "אימייל או סיסמה שגויים";
    case "auth/email-already-in-use":
      return "כבר קיים חשבון עם האימייל הזה";
    case "auth/weak-password":
      return "הסיסמה חייבת להכיל לפחות 6 תווים";
    case "auth/invalid-email":
      return "כתובת אימייל לא תקינה";
    case "auth/too-many-requests":
      return "יותר מדי ניסיונות. נסי שוב מאוחר יותר";
    default:
      return "אירעה שגיאה, נסי שוב";
  }
}

export async function signUp(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const name = email.split("@")[0];
    await updateProfile(cred.user, { displayName: name });
    return { user: { email: cred.user.email, name }, error: null };
  } catch (err) {
    return { user: null, error: friendlyError(err.code) };
  }
}

export async function signIn(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const name = cred.user.displayName || email.split("@")[0];
    return { user: { email: cred.user.email, name }, error: null };
  } catch (err) {
    return { user: null, error: friendlyError(err.code) };
  }
}

export async function logOut() {
  await signOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    callback({
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
    });
  });
}
export async function signInAsManager() {
  await signInAnonymously(auth);
}