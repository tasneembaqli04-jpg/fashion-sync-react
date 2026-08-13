import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getKnownProductTranslation,
  applyProductNameFixes,
  translateProductName,
  translateProductFields,
} from "./translationService";

// All 20 colours defined in KNOWN_COLOR_TRANSLATIONS.
// If anyone deletes or changes a value in the dictionary, these tests fail.
const EXPECTED_COLORS = [
  ["שחור", "Black"],
  ["לבן", "White"],
  ["אדום", "Red"],
  ["כחול", "Blue"],
  ["ירוק", "Green"],
  ["צהוב", "Yellow"],
  ["כתום", "Orange"],
  ["סגול", "Purple"],
  ["ורוד", "Pink"],
  ["חום", "Brown"],
  ["אפור", "Gray"],
  ["בז'", "Beige"],
  ["זהב", "Gold"],
  ["כסף", "Silver"],
  ["טורקיז", "Turquoise"],
  ["בורדו", "Burgundy"],
  ["חאקי", "Khaki"],
  ["שמנת", "Cream"],
  ["תכלת", "Light Blue"],
  ["אחיד", "One Size"],
];

/**
 * Replaces fetch with a spy, so a test can prove that known colours never
 * reach the API at all.
 */
function installFetchSpy() {
  const spy = vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          responseStatus: 200,
          responseData: { translatedText: "NETWORK_WAS_CALLED" },
        }),
    })
  );
  vi.stubGlobal("fetch", spy);
  return spy;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getKnownProductTranslation", () => {
  it("returns the dictionary entry for a known product", () => {
    expect(getKnownProductTranslation("ג'ינס סלים פיט")).toBe("Slim Fit Jeans");
  });

  it("returns null for a product that is not in the dictionary", () => {
    expect(getKnownProductTranslation("חולצת לינן קלאסית")).toBeNull();
  });

  it("matches despite a double space in the Hebrew name", () => {
    expect(getKnownProductTranslation("כפכפי  ים")).toBe("Flip Flops");
  });

  it("matches despite surrounding whitespace", () => {
    expect(getKnownProductTranslation("  חולצת קרופ  ")).toBe("Crop Top");
  });

  it("matches a curly apostrophe as well as a straight one", () => {
    expect(getKnownProductTranslation("ג׳ינס סלים פיט")).toBe("Slim Fit Jeans");
  });

  it("returns null for empty input", () => {
    expect(getKnownProductTranslation("")).toBeNull();
    expect(getKnownProductTranslation(null)).toBeNull();
  });
});

describe("applyProductNameFixes — transliteration errors", () => {
  it('fixes "Pit" to "Fit"', () => {
    expect(applyProductNameFixes("Pit Slim Jeans")).toBe("Fit Slim Jeans");
  });

  it('fixes "Krupp" to "Crop"', () => {
    expect(applyProductNameFixes("Krupp Shirt")).toBe("Crop Shirt");
  });

  it('fixes "Papple" to "Peplum"', () => {
    expect(applyProductNameFixes("Floral Papple Shirt")).toBe(
      "Floral Peplum Shirt"
    );
  });

  it('fixes "Footer" to "Fleece"', () => {
    expect(applyProductNameFixes("Hot Footer Top")).toBe("Hot Fleece Top");
  });
});

describe("applyProductNameFixes — homonyms", () => {
  it('fixes "Apple Sleeve" to "Puff Sleeve"', () => {
    expect(applyProductNameFixes("Apple Sleeve Shirt")).toBe(
      "Puff Sleeve Shirt"
    );
  });

  it('fixes "Tissue" to "Embroidered"', () => {
    expect(applyProductNameFixes("Fine Tissue Shirt")).toBe(
      "Fine Embroidered Shirt"
    );
  });
});

describe("applyProductNameFixes — wording consistency", () => {
  it('fixes "Female" to "Women\'s"', () => {
    expect(applyProductNameFixes("Female corduroy shirt")).toBe(
      "Women's Corduroy Shirt"
    );
  });

  it('does not turn "Women\'s" into "Women\'S"', () => {
    expect(applyProductNameFixes("Women's smooth fabric shirt")).toBe(
      "Women's Smooth Fabric Shirt"
    );
  });

  it('fixes singular "Sunglass" to "Sunglasses"', () => {
    expect(applyProductNameFixes("Sunglass")).toBe("Sunglasses");
  });

  it('leaves an already correct "Sunglasses" alone', () => {
    expect(applyProductNameFixes("Round Sunglasses")).toBe("Round Sunglasses");
  });
});

describe("applyProductNameFixes — gibberish prefixes", () => {
  it('strips the known "PL" prefix', () => {
    expect(applyProductNameFixes("PL Sweat Pants")).toBe("Sweat Pants");
  });

  it('strips a short prefix containing a digit, such as "T7"', () => {
    expect(applyProductNameFixes("T7 High Waist Pants")).toBe(
      "High Waist Pants"
    );
  });

  it('preserves a legitimate short prefix such as "UV"', () => {
    expect(applyProductNameFixes("UV Protection Sunglasses")).toBe(
      "UV Protection Sunglasses"
    );
  });

  it("preserves a normal first word", () => {
    expect(applyProductNameFixes("Red Summer Dress")).toBe("Red Summer Dress");
  });
});

describe("applyProductNameFixes — title case", () => {
  it("capitalises every lowercase word", () => {
    expect(applyProductNameFixes("hoop earrings")).toBe("Hoop Earrings");
  });

  it("capitalises after a hyphen", () => {
    expect(applyProductNameFixes("V-neck shirt")).toBe("V-Neck Shirt");
    expect(applyProductNameFixes("Classic button-up shirt")).toBe(
      "Classic Button-Up Shirt"
    );
  });

  it("keeps minor words lowercase when not first", () => {
    expect(applyProductNameFixes("Knit Top with Collar")).toBe(
      "Knit Top with Collar"
    );
  });

  it("capitalises a minor word when it is first", () => {
    expect(applyProductNameFixes("with collar")).toBe("With Collar");
  });

  it("collapses extra whitespace", () => {
    expect(applyProductNameFixes("Sporty   sneakers")).toBe("Sporty Sneakers");
  });

  it("returns an empty string for empty input", () => {
    expect(applyProductNameFixes("")).toBe("");
    expect(applyProductNameFixes(null)).toBe("");
  });
});

describe("translateProductName", () => {
  it("uses the dictionary without calling the network", async () => {
    const spy = installFetchSpy();

    await expect(translateProductName("חולצת קרופ")).resolves.toBe("Crop Top");
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns an empty string for an empty name without calling the network", async () => {
    const spy = installFetchSpy();

    await expect(translateProductName("")).resolves.toBe("");
    expect(spy).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Guard for the colour translation path.
//
// Colours resolve through KNOWN_COLOR_TRANSLATIONS and never pass through
// translateProductName or the product name fixes. These tests exist to fail
// if anyone accidentally wires the colour path into the product corrections.
// ===========================================================================
describe("color translation — protected path", () => {
  it.each(EXPECTED_COLORS)(
    'translates "%s" to "%s" from the dictionary',
    async (hebrew, english) => {
      const spy = installFetchSpy();

      const result = await translateProductFields({
        name: "",
        desc: "",
        colorNames: [hebrew],
      });

      expect(result.colorNamesEn).toEqual([english]);
      // The colour resolves from the dictionary, so no network call happens
      expect(spy).not.toHaveBeenCalled();
    }
  );

  it("resolves every known colour without a single network call", async () => {
    const spy = installFetchSpy();

    const result = await translateProductFields({
      name: "",
      desc: "",
      colorNames: EXPECTED_COLORS.map(([hebrew]) => hebrew),
    });

    expect(result.colorNamesEn).toEqual(EXPECTED_COLORS.map(([, en]) => en));
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not apply product-name title casing to colours", async () => {
    const spy = installFetchSpy();

    const result = await translateProductFields({
      name: "",
      desc: "",
      colorNames: ["תכלת"],
    });

    // "Light Blue" comes from the dictionary as-is, without product fixes
    expect(result.colorNamesEn).toEqual(["Light Blue"]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not apply product-name fixes to colours", async () => {
    const spy = installFetchSpy();

    // "אחיד" maps to "One Size". Had colours gone through
    // stripGibberishPrefix, the word "One" could have been cut off.
    const result = await translateProductFields({
      name: "",
      desc: "",
      colorNames: ["אחיד"],
    });

    expect(result.colorNamesEn).toEqual(["One Size"]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("keeps the product name and the colours independent", async () => {
    const spy = installFetchSpy();

    const result = await translateProductFields({
      name: "חולצת קרופ",
      desc: "",
      colorNames: ["שחור", "לבן"],
    });

    expect(result.nameEn).toBe("Crop Top");
    expect(result.colorNamesEn).toEqual(["Black", "White"]);
    expect(spy).not.toHaveBeenCalled();
  });
});
