import { describe, it, expect, beforeEach, vi } from "vitest";

// The module writes to Firestore on import; only the local cleanup is under
// test, so the cart service is replaced.
const clearCartFromFirestore = vi.fn();

vi.mock("../../services/orders/ordersService", () => ({ addOrder: vi.fn() }));
vi.mock("../../services/customer/cartFirestore", () => ({
  clearCartFromFirestore: (...args) => clearCartFromFirestore(...args),
}));

const { clearCheckoutCart } = await import("./checkoutActions");
const { LS_KEYS } = await import("./checkoutStorage");

// A stand-in for localStorage, since the tests run without a DOM.
const store = new Map();

beforeEach(() => {
  store.clear();
  clearCartFromFirestore.mockReset().mockResolvedValue(undefined);

  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
});

function fillBasket() {
  store.set(LS_KEYS.CART, "[]");
  store.set(LS_KEYS.PENDING_CART, "[]");
  store.set(LS_KEYS.DISCOUNT, "10");
  store.set(LS_KEYS.COUPON_CODE, "WINTER10");
  store.set(LS_KEYS.POINTS_REDEEMED, "6000");
}

describe("clearCheckoutCart", () => {
  it("removes everything the finished basket left behind", async () => {
    fillBasket();

    await clearCheckoutCart("a@b.c");

    for (const key of [
      LS_KEYS.CART,
      LS_KEYS.PENDING_CART,
      LS_KEYS.DISCOUNT,
      LS_KEYS.COUPON_CODE,
      LS_KEYS.POINTS_REDEEMED,
    ]) {
      expect(store.has(key)).toBe(false);
    }
  });

  it("clears the points redemption, which is what gets spent twice", async () => {
    // The reported fault: points deducted, the key left behind, and the next
    // order applying the same redemption again.
    fillBasket();

    await clearCheckoutCart("a@b.c");

    expect(store.get(LS_KEYS.POINTS_REDEEMED)).toBeUndefined();
  });

  it("still clears the browser when Firestore refuses", async () => {
    // The network call is the only part that can fail, and a coupon left in
    // the browser would be applied to the next order.
    fillBasket();
    clearCartFromFirestore.mockRejectedValue(new Error("offline"));

    await expect(clearCheckoutCart("a@b.c")).resolves.toBeUndefined();

    expect(store.has(LS_KEYS.POINTS_REDEEMED)).toBe(false);
    expect(store.has(LS_KEYS.COUPON_CODE)).toBe(false);
  });

  it("clears the browser even with no account to clear in Firestore", async () => {
    fillBasket();

    await clearCheckoutCart("");

    expect(store.has(LS_KEYS.CART)).toBe(false);
    expect(clearCartFromFirestore).not.toHaveBeenCalled();
  });

  it("passes the account through to Firestore", async () => {
    fillBasket();

    await clearCheckoutCart("a@b.c");

    expect(clearCartFromFirestore).toHaveBeenCalledWith("a@b.c");
  });

  it("does nothing surprising on an already-empty basket", async () => {
    await expect(clearCheckoutCart("a@b.c")).resolves.toBeUndefined();
    expect(store.size).toBe(0);
  });
});
