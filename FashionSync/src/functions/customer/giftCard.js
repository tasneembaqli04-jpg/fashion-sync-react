import { LS_KEYS } from "../../data/constants";

export function buildGiftCardPreview({ amount, customAmount, name, message }) {
  const previewAmount = amount === "other" ? customAmount || "?" : amount;

  return {
    previewAmount,
    previewName: name || "—",
    previewMessage: message ? `"${message}"` : "",
  };
}

export function buyGiftCard({ amount, customAmount, name }) {
  const finalAmount = amount === "other" ? Number(customAmount) : Number(amount);

  if (!name.trim()) {
    return { ok: false, error: "נא להזין שם מקבל." };
  }

  if (!finalAmount || finalAmount < 10) {
    return { ok: false, error: "נא להזין סכום תקין (מינימום ₪10)." };
  }

  const gcCode = "GC-" + Math.random().toString(36).slice(2, 10).toUpperCase();

  const gcItem = [
    {
      code: gcCode,
      name: "כרטיס מתנה FashionSync",
      price: finalAmount,
      qty: 1,
      size: "",
      color: "",
      img: "https://images.pexels.com/photos/5632395/pexels-photo-5632395.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
  ];

  localStorage.setItem(LS_KEYS.PENDING_CART, JSON.stringify(gcItem));

  return { ok: true, code: gcCode };
}