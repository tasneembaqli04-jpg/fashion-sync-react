const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const KNOWN_COLOR_TRANSLATIONS = {
  "שחור": "Black",
  "לבן": "White",
  "אדום": "Red",
  "כחול": "Blue",
  "ירוק": "Green",
  "צהוב": "Yellow",
  "כתום": "Orange",
  "סגול": "Purple",
  "ורוד": "Pink",
  "חום": "Brown",
  "אפור": "Gray",
  "בז'": "Beige",
  "זהב": "Gold",
  "כסף": "Silver",
  "טורקיז": "Turquoise",
  "בורדו": "Burgundy",
  "חאקי": "Khaki",
  "שמנת": "Cream",
  "תכלת": "Light Blue",
  "אחיד": "One Size",
};

/**
 * Layer 1 — full product name dictionary.
 *
 * MyMemory is a translation memory, not a neural translator: it returns the
 * closest match from a user-contributed corpus. That is why fashion terms come
 * back transliterated ("פיט" -> "Pit") or with injected gibberish
 * ("PL Sweat Pants").
 *
 * A name listed here never reaches the API — the translation is exact,
 * instant, and costs nothing against the daily request quota.
 */
const KNOWN_PRODUCT_TRANSLATIONS = {
  // Transliterated instead of translated
  "ג'ינס סלים פיט": "Slim Fit Jeans",
  "חולצת קרופ": "Crop Top",
  "חולצת פפלום פרחונית": "Floral Peplum Top",
  "עליונית פוטר חמה": "Warm Fleece Top",

  // Gibberish injected from unrelated corpus segments
  "מכנסי טרנינג": "Sweatpants",
  "מכנסי מותן גבוה": "High Waist Pants",

  // Homonyms — the right word in the wrong sense
  "חולצת שרוולים תפוחים": "Puff Sleeve Top",
  "חולצת רקמה עדינה": "Fine Embroidered Top",

  // Wrong fashion terms
  "ג'קט טרנינג": "Track Jacket",
  "כפכפי ים": "Flip Flops",
  "כפכפי קיץ נוחים": "Comfortable Summer Flip Flops",
  "מעיל פוך": "Puffer Coat",

  // Full-length trousers, not shorts
  "מכנסי דנים כהים": "Dark Denim Pants",
  "מכנסי עור מדומה": "Faux Leather Pants",
  "מכנסי קארגו": "Cargo Pants",

  // The Hebrew name contains a typo: "פסטנים" for "פסים" (stripes). The
  // product photo shows a black and white striped shirt, and the description
  // repeats the same typo. Mapped to the correct English term here; if the
  // Hebrew name is ever corrected, this key must be updated to match.
  "חולצת פסטנים קלאסית": "Classic Striped Shirt",

  // The automatic Female -> Women's replacement would produce the wrong word
  // order here ("Thermal Women's Tee"), so the name is set explicitly.
  "חולצת תרמית נשית": "Women's Thermal Top",
};

/**
 * Layer 3 — corrections applied to the API result.
 *
 * For new products that are not in the dictionary above but contain a term
 * already known to translate badly.
 */
const POST_TRANSLATION_FIXES = [
  // Transliterations
  [/\bPit\b/g, "Fit"],
  [/\bKrupp\b/g, "Crop"],
  [/\bPapple\b/g, "Peplum"],
  [/\bFooter\b/g, "Fleece"],

  // Homonyms
  [/\bApple Sleeve\b/g, "Puff Sleeve"],
  [/\bTissue\b/g, "Embroidered"],

  // Wording consistency
  [/\bFemale\b/g, "Women's"],
  [/\bSunglass\b/g, "Sunglasses"],
];

// Known gibberish prefixes the API injects at the start of a translation.
const GIBBERISH_PREFIXES = ["PL", "T7"];

/**
 * Normalizes a name for dictionary lookup: unifies apostrophe variants,
 * collapses repeated spaces and trims the edges, so a name with a double
 * space is still found in the dictionary.
 *
 * @param {string} text - The original name.
 * @returns {string} Normalized lookup key.
 */
function normalizeLookupKey(text) {
  return String(text || "")
    .replace(/[׳’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Minor words that stay lowercase in Title Case unless they come first.
const TITLE_CASE_MINOR_WORDS = new Set([
  "a", "an", "and", "at", "for", "in", "of", "on", "or", "the", "to", "with",
]);

/**
 * Converts text to Title Case.
 *
 * Capitalises the first letter of each word and after a hyphen
 * ("V-neck" -> "V-Neck"), but not after an apostrophe, so "Women's" does not
 * become "Women'S". Minor words stay lowercase ("Knit Top with Collar").
 *
 * @param {string} text - Text to convert.
 * @returns {string} The text in Title Case.
 */
function toTitleCase(text) {
  return String(text || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && TITLE_CASE_MINOR_WORDS.has(word.toLowerCase())) {
        return word.toLowerCase();
      }

      return word.replace(
        /(^|-)([a-z])/g,
        (match, separator, letter) => separator + letter.toUpperCase()
      );
    })
    .join(" ");
}

/**
 * Strips a gibberish prefix from the start of a translation.
 *
 * Only removes unambiguous tokens: a known blacklist, or a short
 * token containing a digit. A legitimate prefix such as "UV" is preserved.
 *
 * @param {string} text - The translation from the API.
 * @returns {string} The translation without the prefix.
 */
function stripGibberishPrefix(text) {
  const match = String(text || "").match(/^([A-Za-z0-9]{1,3})\s+(.+)$/);

  if (!match) {
    return text;
  }

  const [, prefix, rest] = match;
  const isBlacklisted = GIBBERISH_PREFIXES.includes(prefix.toUpperCase());
  const hasDigit = /\d/.test(prefix);

  return isBlacklisted || hasDigit ? rest : text;
}

/**
 * Applies every layer 3 correction to a translation returned by the API.
 *
 * Also exported for the one-off script that fixes existing names in Firestore.
 *
 * @param {string} text - The raw translation.
 * @returns {string} The corrected translation in Title Case.
 */
export function applyProductNameFixes(text) {
  const withoutPrefix = stripGibberishPrefix(String(text || "").trim());

  const fixed = POST_TRANSLATION_FIXES.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    withoutPrefix
  );

  return toTitleCase(fixed);
}

/**
 * Returns the known translation for a product name, if the dictionary has one.
 *
 * Also exported for the one-off script.
 *
 * @param {string} name - Product name in Hebrew.
 * @returns {string|null} The known translation, or null if not in the dictionary.
 */
export function getKnownProductTranslation(name) {
  return KNOWN_PRODUCT_TRANSLATIONS[normalizeLookupKey(name)] || null;
}

/**
 * Translates a product name: dictionary first, and only otherwise through the
 * API with corrections applied.
 *
 * This function is for product names only. Customer names, addresses and
 * messages keep using the generic translateText, which must never have fashion
 * terms applied to it.
 *
 * @param {string} name - Product name in Hebrew.
 * @returns {Promise<string>} The product name in English.
 */
export async function translateProductName(name) {
  const known = getKnownProductTranslation(name);

  if (known) {
    return known;
  }

  const translated = await translateText(name);

  return translated ? applyProductNameFixes(translated) : "";
}

function cleanTranslatedText(text) {
  return String(text || "")
    .trim()
    .replace(/[!?.,;:]+$/g, "")
    .trim();
}

export async function translateText(text, sourceLang = "he", targetLang = "en") {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";

  try {
    const params = new URLSearchParams({
      q: trimmed,
      langpair: `${sourceLang}|${targetLang}`,
    });

    const response = await fetch(`${MYMEMORY_URL}?${params.toString()}`);
    const data = await response.json();

    const translated = data?.responseData?.translatedText;

    // A refusal from the API is a handled outcome, not a fault: the empty
    // string sends every caller back to the Hebrew value. Logged at warning
    // level, and without the response body, so a translation the service
    // declines does not read as a broken screen.
    if (!translated || data?.responseStatus !== 200) {
      console.warn(`Translation unavailable for "${trimmed}", keeping Hebrew`);
      return "";
    }

    return cleanTranslatedText(translated);
  } catch (err) {
    // Reached when the network call itself fails. The browser has already
    // printed its own error for the failed request, so only the consequence
    // is worth adding, without the stack.
    console.warn(`Translation request failed, keeping Hebrew: ${err.message}`);
    return "";
  }
}

/**
 * Returns a person's name unchanged, for storing in an "En" field.
 *
 * Names of people are not translated. A translation service maps words to
 * words, and a name is not a word to be mapped: "תמר" comes back as "Date",
 * "שיר" as "Song", and an account name derived from an email address, such as
 * "tasneembaqli04", is not language at all. The result is a corrupted customer
 * record and a network call spent to produce it.
 *
 * The decision is made per field rather than per value, because no inspection
 * of the text can make it. "תמר" is both a woman's name and the word for a
 * date, and the two are spelled identically — only knowing that the field
 * holds a name settles it. Every caller here is a name field: customer names,
 * gift card recipients, contact form senders.
 *
 * Place names are the deliberate exception and stay translated. A city or a
 * street genuinely has an English form, and translating it helps a reader.
 *
 * Callers store the result in the matching "En" field, so the interface finds
 * a value in either language and renders the name as its owner writes it.
 *
 * @param {*} name - The person's name.
 * @returns {string} The same name, trimmed.
 */
export function keepPersonName(name) {
  return String(name || "").trim();
}

async function translateColorName(colorName) {
  const trimmed = String(colorName || "").trim();
  const known = KNOWN_COLOR_TRANSLATIONS[trimmed];

  if (known) return known;

  return await translateText(trimmed);
}

export async function translateProductFields({ name, desc, colorNames = [] }) {
  const [nameEn, descEn, ...colorTranslations] = await Promise.all([
    // The product name goes through the dictionary and fixes.
    // The description stays a free translation.
    translateProductName(name),
    translateText(desc),
    ...colorNames.map((color) => translateColorName(color)),
  ]);

  return {
    nameEn,
    descEn,
    colorNamesEn: colorTranslations,
  };
}