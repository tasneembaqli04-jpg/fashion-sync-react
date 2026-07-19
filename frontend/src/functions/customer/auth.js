import { LS_KEYS } from "../../data/constants";
import { normEmail } from "./helpers";
import { logOut } from "../../services/auth/firebaseAuth";
import { globalDialog } from "../../components/common/DialogProvider";

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