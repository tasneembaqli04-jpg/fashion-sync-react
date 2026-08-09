import { describe, it, expect } from "vitest";
import { isVariantAvailable } from "./stockPolicy";

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