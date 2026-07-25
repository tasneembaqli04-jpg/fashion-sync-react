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

    if (!translated || data?.responseStatus !== 200) {
      console.error("Translation failed for:", trimmed, data);
      return "";
    }

    return cleanTranslatedText(translated);
  } catch (err) {
    console.error("Translation request failed:", err);
    return "";
  }
}

async function translateColorName(colorName) {
  const trimmed = String(colorName || "").trim();
  const known = KNOWN_COLOR_TRANSLATIONS[trimmed];

  if (known) return known;

  return await translateText(trimmed);
}

export async function translateProductFields({ name, desc, colorNames = [] }) {
  const [nameEn, descEn, ...colorTranslations] = await Promise.all([
    translateText(name),
    translateText(desc),
    ...colorNames.map((color) => translateColorName(color)),
  ]);

  return {
    nameEn,
    descEn,
    colorNamesEn: colorTranslations,
  };
}