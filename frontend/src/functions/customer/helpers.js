export function normEmail(email) {
  return String(email || "").trim().toLowerCase();
}