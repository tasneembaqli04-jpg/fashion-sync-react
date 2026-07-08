import { LS_KEYS } from "../../data/constants";
import {
  saveCartToFirestore,
  getCartFromFirestore,
  clearCartFromFirestore,
} from "../../backend/services/customer/cartFirestore";

export async function loadCartFromBackend(email) {
  return await getCartFromFirestore(email);
}

export async function saveCart(email, cart) {
  await saveCartToFirestore(email, cart);
  return cart;
}

export function loadCart() {
  return [];
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

export async function addToCart({
  email,
  cart,
  product,
  variant = { size: "", color: "" },
}) {
  const key = `${product.code}|${variant.size || ""}|${variant.color || ""}`;

  const existingItem = cart.find((item) => item.key === key);

  let nextCart;

  if (existingItem) {
    nextCart = cart.map((item) =>
      item.key !== key
        ? item
        : {
            ...item,
            qty: Math.min(item.qty + 1, product.stock),
          }
    );
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
        sale: product.sale || false,
        qty: 1,
        size: variant.size || "",
        color: variant.color || "",
      },
    ];
  }

  await saveCartToFirestore(email, nextCart);
  return nextCart;
}

export async function changeQty(cart, key, delta, products, email) {
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

  await saveCartToFirestore(email, nextCart);
  return nextCart;
}

export async function removeItem(cart, key, email) {
  const nextCart = cart.filter((item) => item.key !== key);
  await saveCartToFirestore(email, nextCart);
  return nextCart;
}

export async function clearCart(email) {
  await clearCartFromFirestore(email);
}