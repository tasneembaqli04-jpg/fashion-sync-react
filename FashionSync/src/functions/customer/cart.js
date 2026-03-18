import { LS_KEYS } from "../../data/constants";

export function loadCart() {
  return JSON.parse(localStorage.getItem(LS_KEYS.CART) || "[]");
}

export function saveCart(cart) {
  localStorage.setItem(LS_KEYS.CART, JSON.stringify(cart));
}

export function getCartCount(cart) {
  return cart.reduce((sum, item) => sum + (item.qty || 0), 0);
}

export function getCartTotals(cart, appliedDiscount = 0) {
  const raw = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = Math.round(raw * appliedDiscount);
  const total = raw - discount;
  return { raw, discount, total };
}

export function addToCart({ cart, product, variant = { size: "", color: "" } }) {
  const nextCart = [...cart];
  const key = `${product.code}|${variant.size || ""}|${variant.color || ""}`;
  const existing = nextCart.find((item) => item.key === key);

  if (existing) {
    if (existing.qty < product.stock) {
      existing.qty += 1;
    }
  } else {
    nextCart.push({
      key,
      code: product.code,
      name: product.name,
      img: product.img,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      sale: product.sale,
      qty: 1,
      size: variant.size || "",
      color: variant.color || "",
    });
  }

  saveCart(nextCart);
  return nextCart;
}

export function changeQty(cart, key, delta, products) {
  const nextCart = [...cart];
  const index = nextCart.findIndex((item) => item.key === key);
  if (index < 0) return nextCart;

  const item = nextCart[index];
  const product = products.find((p) => p.code === item.code);

  item.qty += delta;

  if (item.qty <= 0) {
    nextCart.splice(index, 1);
  } else {
    item.qty = Math.min(item.qty, product ? product.stock : 99);
  }

  saveCart(nextCart);
  return nextCart;
}

export function removeItem(cart, key) {
  const nextCart = cart.filter((item) => item.key !== key);
  saveCart(nextCart);
  return nextCart;
}