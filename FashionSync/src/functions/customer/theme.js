import { LS_KEYS } from "../../data/constants";

export function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme === "light" ? "light" : "dark");
}

export function getSavedTheme() {
  return localStorage.getItem(LS_KEYS.THEME) || "dark";
}

export function toggleTheme(setTheme) {
  setTheme((prev) => {
    const next = prev === "dark" ? "light" : "dark";
    localStorage.setItem(LS_KEYS.THEME, next);
    applyTheme(next);
    return next;
  });
}