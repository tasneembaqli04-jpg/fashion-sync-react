import { describe, it, expect, beforeEach, vi } from "vitest";

// The service talks to Firestore and Storage on import. Both are replaced with
// in-memory stand-ins so the stock arithmetic can be exercised on its own.
const store = new Map();
const writes = [];

vi.mock("../../firebase", () => ({ db: {}, storage: {} }));

vi.mock("firebase/storage", () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn((_db, _name, code) => ({ code })),
  getDoc: vi.fn(async (ref) => {
    const data = store.get(ref.code);
    return {
      exists: () => data !== undefined,
      data: () => data,
    };
  }),
  updateDoc: vi.fn(async (ref, payload) => {
    writes.push({ code: ref.code, payload });
    store.set(ref.code, { ...store.get(ref.code), ...payload });
  }),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

const { decrementProductsStock } = await import("./productsService");

const lastWrite = () => writes[writes.length - 1].payload;

beforeEach(() => {
  store.clear();
  writes.length = 0;
});

describe("decrementProductsStock — salesLastMonth counts what left the shelf", () => {
  it("counts the full quantity when the colour can cover it", () => {
    store.set("FS-001", {
      salesLastMonth: 0,
      variants: [{ colorName: "שחור", sizes: { S: 2, M: 2, L: 2 } }],
    });

    return decrementProductsStock([
      { code: "FS-001", qty: 5, color: "שחור" },
    ]).then(() => {
      const write = lastWrite();
      expect(write.stock).toBe(1);
      expect(write.salesLastMonth).toBe(5);
      expect(write.variants[0].sizes).toEqual({ S: 0, M: 0, L: 1 });
    });
  });

  // The surplus cannot come off the shelf, so it must not be counted as sold.
  // Stock previously fell by 6 while salesLastMonth rose by 8.
  it("counts only the deducted quantity when the order exceeds the colour", async () => {
    store.set("FS-002", {
      salesLastMonth: 0,
      variants: [{ colorName: "שחור", sizes: { S: 2, M: 2, L: 2 } }],
    });

    await decrementProductsStock([{ code: "FS-002", qty: 8, color: "שחור" }]);

    const write = lastWrite();
    expect(write.stock).toBe(0);
    expect(write.salesLastMonth).toBe(6);
    expect(write.variants[0].sizes).toEqual({ S: 0, M: 0, L: 0 });
  });

  it("counts only the deducted quantity for a specific size", async () => {
    store.set("FS-003", {
      salesLastMonth: 4,
      variants: [{ colorName: "שחור", sizes: { S: 1, M: 3 } }],
    });

    await decrementProductsStock([
      { code: "FS-003", qty: 5, color: "שחור", size: "S" },
    ]);

    const write = lastWrite();
    expect(write.variants[0].sizes.S).toBe(0);
    expect(write.salesLastMonth).toBe(5);
  });

  it("counts nothing when the colour does not exist on the product", async () => {
    store.set("FS-004", {
      salesLastMonth: 7,
      variants: [{ colorName: "שחור", sizes: { M: 5 } }],
    });

    await decrementProductsStock([{ code: "FS-004", qty: 2, color: "אדום" }]);

    const write = lastWrite();
    expect(write.salesLastMonth).toBe(7);
    expect(write.stock).toBe(5);
  });

  it("applies the same rule to a product without variants", async () => {
    store.set("FS-005", { salesLastMonth: 0, stock: 3 });

    await decrementProductsStock([{ code: "FS-005", qty: 10 }]);

    const write = lastWrite();
    expect(write.stock).toBe(0);
    expect(write.salesLastMonth).toBe(3);
  });

  it("keeps stock and salesLastMonth consistent for a normal purchase", async () => {
    store.set("FS-006", { salesLastMonth: 12, stock: 20 });

    await decrementProductsStock([{ code: "FS-006", qty: 4 }]);

    const write = lastWrite();
    expect(write.stock).toBe(16);
    expect(write.salesLastMonth).toBe(16);
  });

  it("preserves fields the write does not touch, such as colorNameEn", async () => {
    store.set("FS-007", {
      salesLastMonth: 0,
      variants: [
        { colorName: "שחור", colorNameEn: "Black", sizes: { M: 3 } },
      ],
    });

    await decrementProductsStock([
      { code: "FS-007", qty: 1, color: "שחור", size: "M" },
    ]);

    expect(lastWrite().variants[0].colorNameEn).toBe("Black");
  });

  it("skips gift cards entirely", async () => {
    await decrementProductsStock([{ code: "GC-1", qty: 1, isGiftCard: true }]);
    expect(writes).toHaveLength(0);
  });

  it("continues to the next item when one product is missing", async () => {
    store.set("FS-009", { salesLastMonth: 0, stock: 5 });

    await decrementProductsStock([
      { code: "MISSING", qty: 1 },
      { code: "FS-009", qty: 2 },
    ]);

    expect(writes).toHaveLength(1);
    expect(lastWrite().stock).toBe(3);
  });
});
