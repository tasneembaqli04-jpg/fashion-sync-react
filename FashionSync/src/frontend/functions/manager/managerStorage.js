export function loadTheme() {
  return localStorage.getItem("fs_theme") === "light" ? "light" : "dark";
}

export function saveTheme(theme) {
  localStorage.setItem("fs_theme", theme);
}