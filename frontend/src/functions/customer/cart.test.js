import { describe, it, expect, vi, beforeEach } from "vitest";

// cart.js persists to Firestore on every mutation. The write is irrelevant to
// the quantity logic, so the whole module is replaced with no-ops.
vi.mock("../../services/customer/cartFirestore", () => ({
  saveCartToFirestore: vi.fn(() => Promise.resolve()),
  getCartFromFirestore: vi.fn(() => Promise.resolve([])),
  clearCartFromFirestore: vi.fn(() => Promise.resolve()),
}));

const { getVariantStockLimit, addToCart, changeQty, getCartTotals, getCartCount } =
  await import("./cart");

// A product whose sizes hold one unit each: the total is 3, but no single
// size has more than 1. This is the shape that exposed the original bug.
const scarceProduct = {
  code: "FS-001",
  name: "חולצה",
  price: 100,
  stock: 3,
  variants: [
    { colorName: "שחור", colorNameEn: "Black", sizes: { S: 1, M: 1, L: 1 } },
  ],
};

const roomyProduct = {
  code: "FS-002",
  name: "שמלה",
  price: 200,
  stock: 30,
  variants: [
    { colorName: "כחול", colorNameEn: "Blue", sizes: { S: 10, M: 10, L: 10 } },
  ],
};

const noVariantProduct = { code: "FS-003", name: "אביזר", price: 50, stock: 4 };

const line = (product, color, size, qty) => ({
  key: `${product.code}|${size}|${color}`,
  code: product.code,
  color,
  size,
  qty,
  price: product.price,
});

beforeEach(() => vi.clearAllMocks());

describe("getVariantStockLimit", () => {
  it("returns the quantity of the selected variant, not the product total", () => {
    expect(getVariantStockLimit(scarceProduct, "שחור", "M")).toBe(1);
    expect(scarceProduct.stock).toBe(3);
  });

  it("reads each size independently", () => {
    expect(getVariantStockLimit(roomyProduct, "כחול", "S")).toBe(10);
    expect(getVariantStockLimit(roomyProduct, "כחול", "L")).toBe(10);
  });

  it("falls back to the product total when there is no size", () => {
    expect(getVariantStockLimit(scarceProduct, "שחור", "")).toBe(3);
  });

  it("falls back to the product total when there is no colour", () => {
    expect(getVariantStockLimit(scarceProduct, "", "M")).toBe(3);
  });

  it("falls back to the product total for a custom size", () => {
    expect(getVariantStockLimit(scarceProduct, "שחור", "אחר")).toBe(3);
  });

  it("falls back to the product total when the product has no variants", () => {
    expect(getVariantStockLimit(noVariantProduct, "שחור", "M")).toBe(4);
  });

  it("falls back to the product total when the colour is not found", () => {
    expect(getVariantStockLimit(scarceProduct, "ורוד", "M")).toBe(3);
  });

  it("falls back to the product total when the size is not in the variant", () => {
    expect(getVariantStockLimit(scarceProduct, "שחור", "XXL")).toBe(3);
  });

  it("returns 0 for a variant that is sold out", () => {
    const soldOut = {
      stock: 5,
      variants: [{ colorName: "שחור", sizes: { S: 5, M: 0 } }],
    };
    expect(getVariantStockLimit(soldOut, "שחור", "M")).toBe(0);
  });

  it("returns 0 for a missing product", () => {
    expect(getVariantStockLimit(null, "שחור", "M")).toBe(0);
  });
});

describe("changeQty — the quantity ceiling", () => {
  it("blocks raising a line above the stock of its own size", async () => {
    // One unit of M exists. The product total is 3, which used to be the cap.
    const cart = [line(scarceProduct, "שחור", "M", 1)];
    const next = await changeQty(cart, cart[0].key, 2, [scarceProduct], "a@b.c");

    expect(next[0].qty).toBe(1);
    expect(next[0].qty).not.toBe(3);
  });

  it("allows a legitimate increase within the variant stock", async () => {
    const cart = [line(roomyProduct, "כחול", "M", 2)];
    const next = await changeQty(cart, cart[0].key, 3, [roomyProduct], "a@b.c");

    expect(next[0].qty).toBe(5);
  });

  it("caps exactly at the variant quantity", async () => {
    const cart = [line(roomyProduct, "כחול", "M", 8)];
    const next = await changeQty(cart, cart[0].key, 50, [roomyProduct], "a@b.c");

    expect(next[0].qty).toBe(10);
  });

  it("still allows decreasing", async () => {
    const cart = [line(roomyProduct, "כחול", "M", 5)];
    const next = await changeQty(cart, cart[0].key, -2, [roomyProduct], "a@b.c");

    expect(next[0].qty).toBe(3);
  });

  it("removes the line when the quantity reaches zero", async () => {
    const cart = [line(roomyProduct, "כחול", "M", 1)];
    const next = await changeQty(cart, cart[0].key, -1, [roomyProduct], "a@b.c");

    expect(next).toHaveLength(0);
  });

  it("uses the product total when the line has no size", async () => {
    const cart = [line(noVariantProduct, "", "", 1)];
    const next = await changeQty(cart, cart[0].key, 10, [noVariantProduct], "a@b.c");

    expect(next[0].qty).toBe(4);
  });

  it("falls back to 99 when the product left the catalogue", async () => {
    const cart = [line(scarceProduct, "שחור", "M", 1)];
    const next = await changeQty(cart, cart[0].key, 5, [], "a@b.c");

    expect(next[0].qty).toBe(6);
  });

  it("leaves other lines untouched", async () => {
    const cart = [
      line(scarceProduct, "שחור", "M", 1),
      line(roomyProduct, "כחול", "S", 2),
    ];
    const next = await changeQty(cart, cart[0].key, 5, [scarceProduct, roomyProduct], "a@b.c");

    expect(next[0].qty).toBe(1);
    expect(next[1].qty).toBe(2);
  });
});

describe("addToCart — the quantity ceiling", () => {
  it("does not increment an existing line past the variant stock", async () => {
    const cart = [line(scarceProduct, "שחור", "M", 1)];
    const next = await addToCart({
      email: "a@b.c",
      cart,
      product: scarceProduct,
      variant: { size: "M", color: "שחור" },
    });

    expect(next[0].qty).toBe(1);
  });

  it("increments normally while stock remains", async () => {
    const cart = [line(roomyProduct, "כחול", "M", 2)];
    const next = await addToCart({
      email: "a@b.c",
      cart,
      product: roomyProduct,
      variant: { size: "M", color: "כחול" },
    });

    expect(next[0].qty).toBe(3);
  });

  it("adds a new line for a different size of the same product", async () => {
    const cart = [line(scarceProduct, "שחור", "M", 1)];
    const next = await addToCart({
      email: "a@b.c",
      cart,
      product: scarceProduct,
      variant: { size: "L", color: "שחור" },
    });

    expect(next).toHaveLength(2);
    expect(next[1].qty).toBe(1);
    expect(next[1].size).toBe("L");
  });
});

describe("regression — the stock inflation scenario", () => {
  it("prevents buying three of a size that holds one", async () => {
    // Original bug: the cart accepted 3 because product.stock was 3.
    // Buying 3 clamped the size to 0, and cancelling added 3 back,
    // inflating total stock from 3 to 5.
    const cart = [line(scarceProduct, "שחור", "M", 1)];

    let next = await changeQty(cart, cart[0].key, 1, [scarceProduct], "a@b.c");
    next = await changeQty(next, cart[0].key, 1, [scarceProduct], "a@b.c");

    expect(next[0].qty).toBe(1);

    // With the cart capped at 1, a purchase can never remove more than exists,
    // so the restock on cancellation cannot create phantom units.
    const bought = next[0].qty;
    const stockInSize = scarceProduct.variants[0].sizes.M;
    expect(bought).toBeLessThanOrEqual(stockInSize);
  });
});

describe("untouched behaviour", () => {
  it("getCartCount still sums quantities", () => {
    expect(getCartCount([{ qty: 2 }, { qty: 3 }])).toBe(5);
  });

  it("getCartTotals still applies a fractional discount", () => {
    const totals = getCartTotals([{ price: 300, qty: 1 }], 0.1, 0);
    expect(totals).toEqual({ raw: 300, discount: 30, total: 270 });
  });
});
