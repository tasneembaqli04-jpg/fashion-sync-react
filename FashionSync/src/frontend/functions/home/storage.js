export const LS = {
  CURRENT_USER: "fs_current_user",
  MODE: "fs_customer_mode",
  THEME: "fs_theme",
};

export const CUSTOMER_PAGE = "/customer";

export function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function saveGuestMode() {
  localStorage.setItem(LS.MODE, "guest");
  localStorage.removeItem(LS.CURRENT_USER);
}

export function saveAuthUser(user) {
  localStorage.setItem(LS.CURRENT_USER, JSON.stringify(user));
  localStorage.setItem(LS.MODE, "auth");
}

export function getSavedUser() {
  return safeJsonParse(localStorage.getItem(LS.CURRENT_USER), null);
}