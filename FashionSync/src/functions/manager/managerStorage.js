// THEME
export function loadTheme() {
  return localStorage.getItem("fs_theme") === "light" ? "light" : "dark";
}

export function saveTheme(theme) {
  localStorage.setItem("fs_theme", theme);
}

// ORDERS
export function loadOrders() {
  const saved = localStorage.getItem("fs_orders");
  return saved ? JSON.parse(saved) : null;
}

export function saveOrders(orders) {
  localStorage.setItem("fs_orders", JSON.stringify(orders));
}

// DELIVERIES
export function loadDeliveries() {
  const saved = localStorage.getItem("fs_deliveries");
  return saved ? JSON.parse(saved) : [];
}

export function saveDeliveries(deliveries) {
  localStorage.setItem("fs_deliveries", JSON.stringify(deliveries));
}

// FEATURED PRODUCT
export function loadFeaturedProductCode() {
  return localStorage.getItem("featuredProductCode") || null;
}

export function saveFeaturedProduct(product) {
  localStorage.setItem("featuredProductCode", product.code);
  localStorage.setItem("featuredProductImage", product.img);
}

export function clearFeaturedProduct() {
  localStorage.removeItem("featuredProductCode");
  localStorage.removeItem("featuredProductImage");
}