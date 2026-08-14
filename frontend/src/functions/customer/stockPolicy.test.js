import { describe, it, expect } from "vitest";
import { isVariantAvailable, getStockStatus } from "./stockPolicy";

describe("isVariantAvailable", () => {
  it("returns false for a null/undefined product", () => {
    expect(isVariantAvailable(null, { color: "שחור", size: "M" })).toBe(false);
  });

  it("always returns true for a custom size ('אחר'), regardless of stock", () => {
    const product = { stock: 0, variants: [] };
    expect(isVariantAvailable(product, { color: "שחור", size: "אחר" })).toBe(true);
  });

  describe("simple products (no variants)", () => {
    it("returns true when stock is positive", () => {
      const product = { stock: 5 };
      expect(isVariantAvailable(product, { color: "", size: "" })).toBe(true);
    });

    it("returns false when stock is exactly 0", () => {
      const product = { stock: 0 };
      expect(isVariantAvailable(product, { color: "", size: "" })).toBe(false);
    });

    it("returns false when stock is negative (data corruption safety)", () => {
      const product = { stock: -3 };
      expect(isVariantAvailable(product, { color: "", size: "" })).toBe(false);
    });
  });

  describe("variant products (color + size)", () => {
    const product = {
      variants: [
        { colorName: "שחור", sizes: { S: 0, M: 3, L: 0 } },
        { colorName: "לבן", sizes: { S: 2, M: 0, L: 1 } },
      ],
    };

    it("returns true for a color+size combination with positive stock", () => {
      expect(isVariantAvailable(product, { color: "שחור", size: "M" })).toBe(true);
    });

    it("returns false for a color+size combination with 0 stock", () => {
      expect(isVariantAvailable(product, { color: "שחור", size: "S" })).toBe(false);
    });

    it("returns false for a color that does not exist on the product", () => {
      expect(isVariantAvailable(product, { color: "אדום", size: "M" })).toBe(false);
    });

    it("returns false for a size that does not exist on the matching variant", () => {
      expect(isVariantAvailable(product, { color: "שחור", size: "XL" })).toBe(false);
    });

    it("correctly distinguishes stock between two different colors of the same product", () => {
      expect(isVariantAvailable(product, { color: "לבן", size: "S" })).toBe(true);
      expect(isVariantAvailable(product, { color: "לבן", size: "M" })).toBe(false);
    });
  });
});
describe("getStockStatus", () => {
  it("classifies the ordinary boundaries", () => {
    expect(getStockStatus(0, 10)).toBe("out");
    expect(getStockStatus(1, 10)).toBe("low");
    expect(getStockStatus(10, 10)).toBe("low");
    expect(getStockStatus(11, 10)).toBe("available");
  });

  // A product edited directly in Firestore could hold a negative quantity.
  // Without one classifier it shows a "low" badge while matching no filter.
  it("treats negative stock as out, not low", () => {
    expect(getStockStatus(-1, 10)).toBe("out");
    expect(getStockStatus(-50, 10)).toBe("out");
  });

  // 5 > undefined is false and 5 <= undefined is false, so a product without
  // a threshold would fall outside every category.
  it("treats a missing threshold as zero", () => {
    expect(getStockStatus(5, undefined)).toBe("available");
    expect(getStockStatus(5, null)).toBe("available");
    expect(getStockStatus(0, undefined)).toBe("out");
  });

  it("handles a threshold of zero", () => {
    expect(getStockStatus(1, 0)).toBe("available");
    expect(getStockStatus(0, 0)).toBe("out");
  });

  it("parses numeric strings from Firestore", () => {
    expect(getStockStatus("0", "10")).toBe("out");
    expect(getStockStatus("5", "10")).toBe("low");
    expect(getStockStatus("20", "10")).toBe("available");
  });

  it("returns exactly one of the three statuses for every input", () => {
    const inputs = [
      [0, 10], [1, 10], [10, 10], [11, 10], [-1, 10], [-50, 3],
      [5, undefined], [0, undefined], [5, null], [1, 0], [0, 0],
      [undefined, 10], [null, null], [NaN, 10], ["", ""],
    ];

    for (const [stock, minStock] of inputs) {
      const status = getStockStatus(stock, minStock);
      expect(["out", "low", "available"]).toContain(status);
    }
  });

  it("keeps the badge and the inventory filter in agreement", () => {
    const inputs = [
      [0, 10], [1, 10], [10, 10], [11, 10], [-1, 10],
      [5, undefined], [0, undefined],
    ];

    for (const [stock, minStock] of inputs) {
      const status = getStockStatus(stock, minStock);
      const matches = ["out", "low", "available"].filter(
        (candidate) => candidate === status
      );
      expect(matches).toHaveLength(1);
    }
  });
});
