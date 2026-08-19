import { describe, it, expect } from "vitest";
import { DEFAULT_STORE_NAME, getStoreName } from "./storeIdentity";

describe("getStoreName", () => {
  it("uses the name the manager set", () => {
    expect(getStoreName({ storeName: "בוטיק רדיע" })).toBe("בוטיק רדיע");
  });

  it("trims it, so a stray space is not part of the name", () => {
    expect(getStoreName({ storeName: "  Boutique  " })).toBe("Boutique");
  });

  it("falls back when the field has never been filled in", () => {
    expect(getStoreName({})).toBe(DEFAULT_STORE_NAME);
    expect(getStoreName({ storeName: "" })).toBe(DEFAULT_STORE_NAME);
  });

  it("falls back when the manager clears the field", () => {
    // Clearing it is allowed. A page headed by a blank space is not.
    expect(getStoreName({ storeName: "   " })).toBe(DEFAULT_STORE_NAME);
  });

  it("falls back before the settings have loaded", () => {
    expect(getStoreName(null)).toBe(DEFAULT_STORE_NAME);
    expect(getStoreName(undefined)).toBe(DEFAULT_STORE_NAME);
  });

  it("never returns an empty string", () => {
    for (const input of [null, undefined, {}, { storeName: "" }, { storeName: " " }]) {
      expect(getStoreName(input).length).toBeGreaterThan(0);
    }
  });
});
