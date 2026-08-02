import { LS_KEYS } from "../../data/constants";
export function applyTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
}

export function getSavedTheme() {
  return localStorage.getItem(LS_KEYS.THEME) || "light";
}

export function toggleTheme(setTheme) {
  setTheme((prev) => {
    const next = prev === "dark" ? "light" : "dark";
    localStorage.setItem(LS_KEYS.THEME, next);
    applyTheme(next);
    return next;
  });
}