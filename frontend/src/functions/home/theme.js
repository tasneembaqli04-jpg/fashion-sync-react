import { LS } from "./storage.js";

export function loadTheme() {
  return localStorage.getItem(LS.THEME) === "light";
}

export function saveTheme(isLight) {
  document.body.classList.toggle("light", isLight);
  localStorage.setItem(LS.THEME, isLight ? "light" : "dark");
}