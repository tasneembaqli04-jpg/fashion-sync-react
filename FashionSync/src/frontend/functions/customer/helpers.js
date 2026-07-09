export function safeJson(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function escHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function normEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function userKey(email, suffix) {
  try {
    return "fs_user_" + btoa(normEmail(email)).replace(/=/g, "") + "_" + suffix;
  } catch {
    return "fs_user_fallback_" + suffix;
  }
}