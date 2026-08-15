import {describe, it, expect} from "vitest";
import chatProductService from "./chatProductService.js";

// The service is CommonJS, so it arrives as one default export.
const {
  toHebrewStem,
  wordMatchesProductWords,
  getProductRelevanceScore,
  compareProductsForDisplay,
} = chatProductService;

describe("toHebrewStem", () => {
  // Hebrew inflects the same noun in ways plain string matching cannot see
  // through, so the search compares stems rather than the words themselves.
  it("drops the construct-state ending so the two forms meet", () => {
    expect(toHebrewStem("שמלה")).toBe("שמל");
    expect(toHebrewStem("שמלת")).toBe("שמל");
    expect(toHebrewStem("שמלה")).toBe(toHebrewStem("שמלת"));
  });

  it("folds a final letter to its regular form", () => {
    expect(toHebrewStem("אדום")).toBe("אדומ");
    expect(toHebrewStem("אדומה")).toBe("אדומ");
    expect(toHebrewStem("אדום")).toBe(toHebrewStem("אדומה"));
  });

  // The four-character floor keeps every stem at three or more characters, so
  // short words are not ground down into something that matches everything.
  it("leaves a three-letter word alone", () => {
    expect(toHebrewStem("אמה")).toBe("אמה");
    expect(toHebrewStem("ערב")).toBe("ערב");
  });

  it("strips the ending only at four characters and above", () => {
    expect(toHebrewStem("מכנסת")).toBe("מכנס");
    expect(toHebrewStem("בית")).toBe("בית");
  });

  it("leaves a word that ends in neither ה nor ת", () => {
    expect(toHebrewStem("מכנסיים")).toBe("מכנסיימ");
  });
});

describe("wordMatchesProductWords", () => {
  it("matches the same noun in a different form", () => {
    expect(wordMatchesProductWords("שמלה", ["שמלת", "ערב"])).toBe(true);
  });

  it("matches a stem that is a prefix of a longer one", () => {
    expect(wordMatchesProductWords("מכנס", ["מכנסיים"])).toBe(true);
  });

  // Whole-word prefixes only: a run of characters inside another word is not
  // a match, so a search for "ערב" does not drag in "מעורב".
  it("does not match a word that merely contains the letters", () => {
    expect(wordMatchesProductWords("ערב", ["מעורב"])).toBe(false);
  });

  it("returns false when nothing in the product matches", () => {
    expect(wordMatchesProductWords("נעליים", ["שמלת", "ערב"])).toBe(false);
  });
});

describe("getProductRelevanceScore", () => {
  const evening = {name: "שמלת ערב אלגנטית", desc: "לחתונה", season: "summer"};

  it("adds three for the occasion, two for the style, one for the season", () => {
    expect(
        getProductRelevanceScore(evening, ["חתונה"], "אלגנטית", "summer"),
    ).toBe(6);
  });

  it("scores the season alone when nothing else matches", () => {
    const plain = {name: "שמלה", desc: "", season: "summer"};
    expect(getProductRelevanceScore(plain, ["חתונה"], "אלגנטית", "summer")).toBe(1);
  });

  it("scores zero for a product matching none of the three", () => {
    const coat = {name: "מעיל", desc: "", season: "winter"};
    expect(getProductRelevanceScore(coat, ["חתונה"], "אלגנטית", "summer")).toBe(0);
  });

  it("counts an all-season product towards the requested season", () => {
    const allYear = {name: "חולצה", desc: "", season: "all"};
    expect(getProductRelevanceScore(allYear, [], null, "summer")).toBe(1);
  });

  // Scoring only ever reorders. A product that matches nothing still scores,
  // which is what stops a search coming back empty because of the occasion.
  it("never returns a value that could reject a product", () => {
    const coat = {name: "מעיל", desc: "", season: "winter"};
    expect(getProductRelevanceScore(coat, ["חתונה"], "אלגנטית", "summer"))
        .toBeGreaterThanOrEqual(0);
  });

  it("caps at six, the sum of the three weights", () => {
    expect(getProductRelevanceScore(evening, ["חתונה"], "אלגנטית", "summer"))
        .toBeLessThanOrEqual(6);
  });
});

describe("compareProductsForDisplay", () => {
  function product(overrides) {
    return {
      price: 100,
      relevanceScore: 0,
      variants: [{sizes: {M: 5}}],
      ...overrides,
    };
  }

  const soldOut = (overrides) =>
    product({variants: [{sizes: {M: 0}}], ...overrides});

  it("puts an available product above a sold-out one", () => {
    const available = product({relevanceScore: 0});
    const gone = soldOut({relevanceScore: 6});

    expect(compareProductsForDisplay(available, gone)).toBeLessThan(0);
    expect(compareProductsForDisplay(gone, available)).toBeGreaterThan(0);
  });

  it("puts the higher score first when both are available", () => {
    const better = product({relevanceScore: 6});
    const worse = product({relevanceScore: 3});

    expect(compareProductsForDisplay(better, worse)).toBeLessThan(0);
  });

  it("puts the cheaper first when the scores tie", () => {
    const cheap = product({relevanceScore: 3, price: 280});
    const dear = product({relevanceScore: 3, price: 390});

    expect(compareProductsForDisplay(cheap, dear)).toBeLessThan(0);
  });

  // The worked example: four dresses, all matching. D is the best match and
  // the cheapest of its rank, and still sorts last because it cannot be bought.
  it("orders a full result set by all three rules", () => {
    const a = product({relevanceScore: 6, price: 450});
    const b = product({relevanceScore: 3, price: 280});
    const c = product({relevanceScore: 3, price: 390});
    const d = soldOut({relevanceScore: 6, price: 300});

    const sorted = [d, c, b, a].sort(compareProductsForDisplay);

    expect(sorted).toEqual([a, b, c, d]);
  });
});
