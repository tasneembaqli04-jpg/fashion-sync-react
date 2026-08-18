import { describe, it, expect } from "vitest";
import { matchesAnySearchField, normalizeForSearch } from "./textSearch";

const HEBREW = "שמלת ערב אלגנטית";
const ENGLISH = "Elegant Evening Dress";

describe("normalizeForSearch", () => {
  it("folds case and trims", () => {
    expect(normalizeForSearch("  Dress  ")).toBe("dress");
  });

  it("turns a missing value into an empty string", () => {
    expect(normalizeForSearch(null)).toBe("");
    expect(normalizeForSearch(undefined)).toBe("");
  });

  it("leaves Hebrew unchanged apart from trimming", () => {
    expect(normalizeForSearch(" שמלה ")).toBe("שמלה");
  });
});

describe("matchesAnySearchField", () => {
  it("shows everything when nothing has been typed", () => {
    expect(matchesAnySearchField("", HEBREW, ENGLISH)).toBe(true);
    expect(matchesAnySearchField("   ", HEBREW, ENGLISH)).toBe(true);
  });

  it("finds a record by its English name", () => {
    expect(matchesAnySearchField("dress", HEBREW, ENGLISH)).toBe(true);
  });

  it("finds the same record by its Hebrew name", () => {
    expect(matchesAnySearchField("שמלת", HEBREW, ENGLISH)).toBe(true);
  });

  it("ignores case on both sides", () => {
    expect(matchesAnySearchField("DRESS", HEBREW, ENGLISH)).toBe(true);
    expect(matchesAnySearchField("dReSs", HEBREW, ENGLISH)).toBe(true);
  });

  it("ignores surrounding spaces in the query", () => {
    expect(matchesAnySearchField("  dress ", HEBREW, ENGLISH)).toBe(true);
  });

  it("matches part of a word, as a search box is expected to", () => {
    expect(matchesAnySearchField("eve", HEBREW, ENGLISH)).toBe(true);
  });

  it("rejects a query in neither name", () => {
    expect(matchesAnySearchField("jacket", HEBREW, ENGLISH)).toBe(false);
  });

  it("skips missing fields rather than throwing", () => {
    expect(matchesAnySearchField("dress", null, undefined, ENGLISH)).toBe(true);
    expect(matchesAnySearchField("dress", null, undefined)).toBe(false);
  });

  it("works with a single field", () => {
    expect(matchesAnySearchField("FS-001", "FS-001")).toBe(true);
  });

  it("matches a transliterated name from either spelling", () => {
    expect(matchesAnySearchField("rotem", "רותם", "Rotem")).toBe(true);
    expect(matchesAnySearchField("רותם", "רותם", "Rotem")).toBe(true);
  });

  it("does not treat a Hebrew query as a wildcard", () => {
    expect(matchesAnySearchField("מכנס", HEBREW, ENGLISH)).toBe(false);
  });
});
