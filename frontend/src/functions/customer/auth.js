import { LS_KEYS } from "../../data/constants";
import { normEmail } from "./helpers";
import { logOut } from "../../services/auth/firebaseAuth";
import { globalDialog } from "../../components/common/DialogProvider";

/**
 * Writes the display cache from the authenticated Firebase user.
 *
 * Firebase Auth is the source of truth for identity; localStorage only exists
 * so the interface can render a name before the auth listener resolves. This
 * keeps the two in step whenever Firebase reports a signed-in user.
 *
 * @param {object} firebaseUser - The user object from Firebase Auth.
 * @returns {{email: string, name: string}} The cached identity.
 */
export function syncAuthCache(firebaseUser) {
  const email = normEmail(firebaseUser?.email);
  const name = firebaseUser?.displayName || email.split("@")[0];

  localStorage.setItem(LS_KEYS.MODE, "auth");
  localStorage.setItem(LS_KEYS.CURRENT_USER, JSON.stringify({ email, name }));

  return { email, name };
}

/**
 * Whether the visitor is browsing as a guest.
 *
 * Guest mode has no Firebase session by design, so the auth listener must not
 * treat a missing user as a stale cache and sign the visitor out.
 *
 * @returns {boolean} true while guest mode is active.
 */
export function isGuestMode() {
  return localStorage.getItem(LS_KEYS.MODE) === "guest";
}

/**
 * Clears the identity cache.
 *
 * Called when Firebase reports no signed-in user, so the interface can never
 * show a logged-in customer whose Firestore requests would be denied.
 *
 * @returns {void}
 */
export function clearAuthCache() {
  localStorage.removeItem(LS_KEYS.CURRENT_USER);
  localStorage.removeItem(LS_KEYS.MODE);
}

/**
 * Reads the identity cache and the sign-in query parameters.
 *
 * This runs synchronously on mount so the page can render immediately. It is
 * a cache read, not an authority: the onAuthStateChanged listener in
 * Customer.jsx confirms or overrides whatever this returns.
 *
 * @returns {{mode: string|null, currentUser: object|null, isGuest: boolean}}
 */
export function initAuth() {
  const qs = new URLSearchParams(window.location.search);
  const mode = (qs.get("mode") || "").trim();
  const email = normEmail(qs.get("email"));
  const name = (qs.get("name") || "").trim();

  if (mode === "guest") {
    localStorage.setItem(LS_KEYS.MODE, "guest");
    localStorage.removeItem(LS_KEYS.CURRENT_USER);
    window.history.replaceState({}, "", window.location.pathname);
  } else if (mode === "auth" && email) {
    const user = { email, name: name || email.split("@")[0] };
    localStorage.setItem(LS_KEYS.MODE, "auth");
    localStorage.setItem(LS_KEYS.CURRENT_USER, JSON.stringify(user));
    window.history.replaceState({}, "", window.location.pathname);
  }

  const storedMode = localStorage.getItem(LS_KEYS.MODE);

  if (!storedMode) {
    return { mode: null, currentUser: null, isGuest: false };
  }

  if (storedMode === "guest") {
    return { mode: "guest", currentUser: null, isGuest: true };
  }

  const storedUser = JSON.parse(localStorage.getItem(LS_KEYS.CURRENT_USER) || "null");

  if (storedUser?.email) {
    return {
      mode: "auth",
      currentUser: {
        email: normEmail(storedUser.email),
        name: storedUser.name || normEmail(storedUser.email).split("@")[0],
      },
      isGuest: false,
    };
  }

  localStorage.removeItem(LS_KEYS.MODE);
  return { mode: null, currentUser: null, isGuest: false };
}

export function goLogin() {
  localStorage.removeItem(LS_KEYS.MODE);
  localStorage.removeItem(LS_KEYS.CURRENT_USER);
  window.location.href = "/";
}

export async function goHome(t) {
  const confirmed = await globalDialog.confirm(t ? t.confirmGoHome : "לחזור לדף הבית?");
  if (confirmed) {
    window.location.href = "/";
  }
}

export async function guestPrompt(t) {
  const confirmed = await globalDialog.confirm(
    t ? t.confirmGuestAction : "לפעולה זו עליך להתחבר.\nלעבור לדף הכניסה?"
  );
  if (confirmed) {
    goLogin();
  }
}

export async function doLogout(setCart, t) {
  const confirmed = await globalDialog.confirm(t ? t.confirmLogout : "להתנתק?");
  if (!confirmed) return;

  await logOut();

  localStorage.removeItem(LS_KEYS.CURRENT_USER);
  localStorage.removeItem(LS_KEYS.MODE);

  setCart([]);
  window.location.href = "/";
}