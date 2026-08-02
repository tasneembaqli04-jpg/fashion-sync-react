export function loadTheme() {
  return localStorage.getItem("fs_theme") === "dark" ? "dark" : "light";
}

export function saveTheme(theme) {
  localStorage.setItem("fs_theme", theme);
}