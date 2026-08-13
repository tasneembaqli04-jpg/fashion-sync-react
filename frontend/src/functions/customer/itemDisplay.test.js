import { describe, it, expect } from "vitest";
import { getItemName, getItemColor, getItemSize } from "./itemDisplay";

describe("getItemName", () => {
  const item = { name: "חולצת לינן קלאסית", nameEn: "Classic Linen Shirt" };

  it("returns the Hebrew name in Hebrew", () => {
    expect(getItemName(item, "he")).toBe("חולצת לינן קלאסית");
  });

  it("returns the English name in English", () => {
    expect(getItemName(item, "en")).toBe("Classic Linen Shirt");
  });

  it("falls back to Hebrew in English when nameEn is missing", () => {
    expect(getItemName({ name: "שמלת ערב" }, "en")).toBe("שמלת ערב");
  });

  it("falls back to Hebrew in English when nameEn is an empty string", () => {
    expect(getItemName({ name: "שמלת ערב", nameEn: "" }, "en")).toBe("שמלת ערב");
  });

  it("never uses nameEn in Hebrew, even when it exists", () => {
    expect(getItemName(item, "he")).toBe("חולצת לינן קלאסית");
  });

  it("treats an unknown language like Hebrew", () => {
    expect(getItemName(item, "fr")).toBe("חולצת לינן קלאסית");
  });

  it("translates a legacy gift card that has no nameEn", () => {
    const legacyGiftCard = { name: "כרטיס מתנה FashionSync" };
    expect(getItemName(legacyGiftCard, "en")).toBe("FashionSync Gift Card");
  });

  it("keeps the Hebrew gift card name in Hebrew", () => {
    const legacyGiftCard = { name: "כרטיס מתנה FashionSync" };
    expect(getItemName(legacyGiftCard, "he")).toBe("כרטיס מתנה FashionSync");
  });

  it("prefers nameEn over the legacy gift card fallback", () => {
    const newGiftCard = {
      name: "כרטיס מתנה FashionSync",
      nameEn: "FashionSync Gift Card",
    };
    expect(getItemName(newGiftCard, "en")).toBe("FashionSync Gift Card");
  });

  it("returns an empty string for a null item", () => {
    expect(getItemName(null, "en")).toBe("");
  });

  it("returns an empty string for an undefined item", () => {
    expect(getItemName(undefined, "he")).toBe("");
  });

  it("returns an empty string when the item has no name at all", () => {
    expect(getItemName({}, "en")).toBe("");
    expect(getItemName({}, "he")).toBe("");
  });
});

describe("getItemColor", () => {
  const item = { color: "לבן", colorEn: "White" };

  it("returns the Hebrew color in Hebrew", () => {
    expect(getItemColor(item, "he")).toBe("לבן");
  });

  it("returns the English color in English", () => {
    expect(getItemColor(item, "en")).toBe("White");
  });

  it("falls back to Hebrew in English when colorEn is missing", () => {
    expect(getItemColor({ color: "שחור" }, "en")).toBe("שחור");
  });

  it("falls back to Hebrew in English when colorEn is an empty string", () => {
    expect(getItemColor({ color: "שחור", colorEn: "" }, "en")).toBe("שחור");
  });

  it("returns an empty string when the item has no color (gift card)", () => {
    expect(getItemColor({ color: "" }, "en")).toBe("");
    expect(getItemColor({ color: "" }, "he")).toBe("");
  });

  it("returns an empty string for a null item", () => {
    expect(getItemColor(null, "en")).toBe("");
  });

  it("returns an empty string when the item has no color field", () => {
    expect(getItemColor({}, "en")).toBe("");
  });
});

describe("getItemSize", () => {
  it("returns a regular size unchanged in both languages", () => {
    expect(getItemSize({ size: "M" }, "he")).toBe("M");
    expect(getItemSize({ size: "M" }, "en")).toBe("M");
  });

  it('translates "אחיד" to "One Size" in English', () => {
    expect(getItemSize({ size: "אחיד" }, "en")).toBe("One Size");
  });

  it('keeps "אחיד" in Hebrew', () => {
    expect(getItemSize({ size: "אחיד" }, "he")).toBe("אחיד");
  });

  it('does not translate "אחיד" for an unknown language', () => {
    expect(getItemSize({ size: "אחיד" }, "fr")).toBe("אחיד");
  });

  it("returns an empty string when the item has no size (gift card)", () => {
    expect(getItemSize({ size: "" }, "en")).toBe("");
    expect(getItemSize({ size: "" }, "he")).toBe("");
  });

  it("returns an empty string for a null item", () => {
    expect(getItemSize(null, "en")).toBe("");
  });

  it("returns an empty string when the item has no size field", () => {
    expect(getItemSize({}, "en")).toBe("");
  });
});
