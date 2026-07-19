import { auth } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

function friendlyError(code, t) {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return t.wrongPassword;
    case "auth/email-already-in-use":
      return t.emailInUse;
    case "auth/weak-password":
      return t.weakPassword;
    case "auth/invalid-email":
      return t.invalidEmail;
    case "auth/too-many-requests":
      return t.tooManyRequests;
    default:
      return t.genericError;
  }
}

export async function signUp(email, password, t) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const name = email.split("@")[0];
    await updateProfile(cred.user, { displayName: name });
    return { user: { email: cred.user.email, name }, error: null, errorCode: null };
  } catch (err) {
    return { user: null, error: friendlyError(err.code, t), errorCode: err.code };
  }
}

export async function signIn(email, password, t) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const name = cred.user.displayName || email.split("@")[0];
    return { user: { email: cred.user.email, name }, error: null, errorCode: null };
  } catch (err) {
    return { user: null, error: friendlyError(err.code, t), errorCode: err.code };
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