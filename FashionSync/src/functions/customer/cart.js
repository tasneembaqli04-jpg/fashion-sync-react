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
  const key = `${product.code}|${variant.size || ""}|${variant.color || ""}`;

  const existingItem = cart.find((item) => item.key === key);

  let nextCart;

  if (existingItem) {
    nextCart = cart.map((item) => {
      if (item.key !== key) return item;

      return {
        ...item,
        qty: Math.min(item.qty + 1, product.stock),
      };
    });
  } else {
    nextCart = [
      ...cart,
      {
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
      },
    ];
  }

  saveCart(nextCart);
  return nextCart;
}

export function changeQty(cart, key, delta, products) {
  const currentItem = cart.find((item) => item.key === key);
  if (!currentItem) return cart;

  const product = products.find((p) => p.code === currentItem.code);
  const maxStock = product ? product.stock : 99;
  const nextQty = currentItem.qty + delta;

  let nextCart;

  if (nextQty <= 0) {
    nextCart = cart.filter((item) => item.key !== key);
  } else {
    nextCart = cart.map((item) =>
      item.key === key
        ? { ...item, qty: Math.min(nextQty, maxStock) }
        : item
    );
  }

  saveCart(nextCart);
  return nextCart;
}

export function removeItem(cart, key) {
  const nextCart = cart.filter((item) => item.key !== key);
  saveCart(nextCart);
  return nextCart;
}