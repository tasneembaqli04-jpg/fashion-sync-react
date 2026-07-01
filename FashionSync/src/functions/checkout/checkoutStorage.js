import { addOrder } from "../orders/ordersService";
const LS_KEYS = {
  CURRENT_USER: "fs_current_user",
  CART: "fs_cart",
  PENDING_CART: "fs_pending_cart",
  RECEIPTS: "fs_receipts",
  PRODUCTS: "fs_products",
  DISCOUNT: "fs_applied_discount",
  ORDERS_PREFIX: "fs_orders_",
};

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getOrdersKey(email) {
  return `${LS_KEYS.ORDERS_PREFIX}${normalizeEmail(email)}`;
}

export function getCurrentUser() {
  const user = safeParse(localStorage.getItem(LS_KEYS.CURRENT_USER), null);
  return user && typeof user === "object" ? user : null;
}

export function getAppliedDiscountPercent() {
  const raw = localStorage.getItem(LS_KEYS.DISCOUNT);

  if (raw === null || raw === undefined || raw === "") {
    return 0;
  }

  const value = Number(raw);

  if (Number.isNaN(value)) {
    return 0;
  }

  if (value > 0 && value < 1) {
    return Math.round(value * 100);
  }

  if (value >= 1 && value <= 100) {
    return value;
  }

  return 0;
}

export function buildCart() {
  const pendingCart = safeParse(localStorage.getItem(LS_KEYS.PENDING_CART), null);
  if (Array.isArray(pendingCart) && pendingCart.length > 0) {
    return pendingCart;
  }

  const cart = safeParse(localStorage.getItem(LS_KEYS.CART), []);
  if (Array.isArray(cart)) {
    return cart;
  }

  return [];
}

export function saveReceipt(receipt) {
  if (!receipt || typeof receipt !== "object") {
    throw new Error("Receipt is invalid");
  }

  const receipts = safeParse(localStorage.getItem(LS_KEYS.RECEIPTS), []);

  if (!Array.isArray(receipts)) {
    throw new Error("Stored receipts data is invalid");
  }

  receipts.push(receipt);
  localStorage.setItem(LS_KEYS.RECEIPTS, JSON.stringify(receipts));

  return receipt;
}
export function loadOrders(email) {
  const userEmail = normalizeEmail(email || getCurrentUser()?.email);

  if (!userEmail) {
    return [];
  }

  const orders = safeParse(localStorage.getItem(getOrdersKey(userEmail)), []);
  return Array.isArray(orders) ? orders : [];
}

export function saveOrders(orders, email) {
  const userEmail = normalizeEmail(email || getCurrentUser()?.email);

  if (!userEmail) {
    throw new Error("User email is missing");
  }

  if (!Array.isArray(orders)) {
    throw new Error("Orders must be an array");
  }

  localStorage.setItem(getOrdersKey(userEmail), JSON.stringify(orders));
  return orders;
}

export function addReceiptToOrders(receipt) {
  if (!receipt || typeof receipt !== "object") {
    throw new Error("Receipt is invalid");
  }

  const customerEmail = normalizeEmail(
    receipt?.customer?.email || getCurrentUser()?.email
  );

  if (!customerEmail) {
    throw new Error("Customer email is missing");
  }

  const existingOrders = loadOrders(customerEmail);

  const alreadyExists = existingOrders.some((order) => order.id === receipt.id);
  if (alreadyExists) {
    return existingOrders;
  }

  const newOrder = {
    id: receipt.id,
    date: receipt.date
      ? new Date(receipt.date).toLocaleDateString("he-IL")
      : new Date().toLocaleDateString("he-IL"),
    items: Array.isArray(receipt.items) ? receipt.items : [],
    total: Number(receipt.total) || 0,
    status: 0,
    steps: ["אושרה", "בהכנה", "נשלחה", "נמסרה"],
    payMethod: receipt.payMethod || "",
    shipping: receipt.shipping || null,
  };

  const updatedOrders = [...existingOrders, newOrder];
  saveOrders(updatedOrders, customerEmail);

  return updatedOrders;
}

export async function saveReceiptAndOrder(receipt) {
  const savedReceipt = saveReceipt(receipt);
  await addOrder(savedReceipt);
  return savedReceipt;
}

export function updateProductsStock(cartItems = []) {
  if (!Array.isArray(cartItems)) {
    throw new Error("Cart items must be an array");
  }

  const rawProducts = localStorage.getItem(LS_KEYS.PRODUCTS);

  if (!rawProducts) {
    return [];
  }

  let products = safeParse(rawProducts, []);

  if (!Array.isArray(products)) {
    return [];
  }

  cartItems.forEach((cartItem) => {
    if (!cartItem?.code) return;

    const product = products.find((item) => item.code === cartItem.code);
    if (!product) return;

    const qty = Number(cartItem.qty) || 0;

    if (typeof product.stock === "number") {
      product.stock = Math.max(0, product.stock - qty);
      return;
    }

    if (product.stock && typeof product.stock === "object") {
      const sizeKey = cartItem.size;
      if (sizeKey && typeof product.stock[sizeKey] === "number") {
        product.stock[sizeKey] = Math.max(0, product.stock[sizeKey] - qty);
      }
    }
  });

  localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(products));
  return products;
}

export function clearCheckoutCart() {
  localStorage.removeItem(LS_KEYS.PENDING_CART);
  localStorage.removeItem(LS_KEYS.CART);
}