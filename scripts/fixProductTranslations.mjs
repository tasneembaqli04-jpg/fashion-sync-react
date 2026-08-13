/**
 * One-off script that repairs the nameEn field of products in Firestore.
 *
 * This is not production code: it lives outside frontend/src, so Vite never
 * includes it in the build.
 *
 * translationService.js is the single source of truth — this script imports
 * the dictionary and the correction helpers from it, so the script and the
 * application can never drift apart.
 *
 * Usage:
 *   node scripts/fixProductTranslations.mjs            dry run, prints only
 *   node scripts/fixProductTranslations.mjs --apply    writes to Firestore
 *
 * Writing requires manager permissions, supplied through environment
 * variables: FS_MANAGER_EMAIL and FS_MANAGER_PASSWORD.
 */
import {
  getKnownProductTranslation,
  applyProductNameFixes,
} from "../frontend/src/services/translation/translationService.js";

const PROJECT_ID = "fashionsync-dc79f";
const API_KEY = "AIzaSyDHp13Aaycgle5W4EDIN0t4vA_9c1rDk4M";

const APPLY = process.argv.includes("--apply");

const FIRESTORE_BASE =
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
  `/databases/(default)/documents`;

/**
 * Converts a Firestore REST value into a plain JS value.
 *
 * @param {object} value - Value in REST format.
 * @returns {*} The decoded value.
 */
function decode(value) {
  if (!value || typeof value !== "object") return value;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decode);
  if ("mapValue" in value) {
    const result = {};
    for (const [key, inner] of Object.entries(value.mapValue.fields || {})) {
      result[key] = decode(inner);
    }
    return result;
  }
  return null;
}

/**
 * Fetches every product from Firestore.
 *
 * @returns {Promise<object[]>} The products.
 */
async function fetchProducts() {
  const products = [];
  let pageToken = "";

  do {
    const url =
      `${FIRESTORE_BASE}/products?key=${API_KEY}&pageSize=300` +
      (pageToken ? `&pageToken=${pageToken}` : "");

    const response = await fetch(url);
    const body = await response.json();

    if (body.error) {
      throw new Error(`שגיאת קריאה מ-Firestore: ${body.error.message}`);
    }

    for (const document of body.documents || []) {
      const fields = {};
      for (const [key, value] of Object.entries(document.fields || {})) {
        fields[key] = decode(value);
      }
      fields.__docId = document.name.split("/").pop();
      products.push(fields);
    }

    pageToken = body.nextPageToken || "";
  } while (pageToken);

  return products;
}

/**
 * Signs in as the manager and returns an ID token.
 *
 * Updating nameEn requires manager permissions per firestore.rules.
 *
 * @returns {Promise<string>} The ID token.
 */
async function signInAsManager() {
  const email = process.env.FS_MANAGER_EMAIL;
  const password = process.env.FS_MANAGER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "חסרים משתני סביבה FS_MANAGER_EMAIL ו-FS_MANAGER_PASSWORD"
    );
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const body = await response.json();

  if (body.error) {
    throw new Error(`התחברות נכשלה: ${body.error.message}`);
  }

  return body.idToken;
}

/**
 * Updates the nameEn field of a single product.
 *
 * updateMask guarantees that only nameEn is written — no other field is
 * touched, even at the API level.
 *
 * @param {string} docId - Firestore document id.
 * @param {string} nameEn - The new English name.
 * @param {string} idToken - Manager ID token.
 * @returns {Promise<void>}
 */
async function updateNameEn(docId, nameEn, idToken) {
  const url =
    `${FIRESTORE_BASE}/products/${encodeURIComponent(docId)}` +
    `?key=${API_KEY}&updateMask.fieldPaths=nameEn`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields: { nameEn: { stringValue: nameEn } } }),
  });

  const body = await response.json();

  if (body.error) {
    throw new Error(`עדכון ${docId} נכשל: ${body.error.message}`);
  }
}

/**
 * Computes the corrected name for a product.
 *
 * Layer 1 — exact dictionary match.
 * Layer 3 — wording fixes and Title Case applied to the stored translation.
 *
 * The script never calls the translation API: it only reworks what is already
 * stored, so a run cannot consume quota or introduce new surprises.
 *
 * @param {object} product - The product from Firestore.
 * @returns {{nextName: string, source: string}} Proposed name and its source.
 */
function computeFixedName(product) {
  const known = getKnownProductTranslation(product.name);

  if (known) {
    return { nextName: known, source: "מילון" };
  }

  return {
    nextName: applyProductNameFixes(product.nameEn || ""),
    source: "תיקון ניסוח",
  };
}

/**
 * Runs the process.
 */
async function run() {
  console.log(
    APPLY
      ? "=== מצב כתיבה (--apply) ===\n"
      : "=== מצב תצוגה בלבד. להרצה אמיתית הוסיפי --apply ===\n"
  );

  const products = await fetchProducts();
  console.log(`נשלפו ${products.length} מוצרים\n`);

  const changes = [];

  for (const product of products) {
    const current = product.nameEn || "";
    const { nextName, source } = computeFixedName(product);

    if (!nextName || nextName === current) {
      continue;
    }

    changes.push({
      docId: product.__docId,
      code: product.code || product.__docId,
      hebrew: product.name || "",
      from: current,
      to: nextName,
      source,
    });
  }

  if (!changes.length) {
    console.log("אין שינויים. כל השמות כבר תקינים.");
    return;
  }

  console.log(`נמצאו ${changes.length} שינויים:\n`);

  for (const change of changes) {
    console.log(`${change.code}  ${change.hebrew}`);
    console.log(`   לפני: ${change.from}`);
    console.log(`   אחרי: ${change.to}    [${change.source}]`);
    console.log("");
  }

  const byDictionary = changes.filter((c) => c.source === "מילון").length;
  console.log(`סיכום: ${byDictionary} מהמילון, ` +
    `${changes.length - byDictionary} תיקוני ניסוח\n`);

  if (!APPLY) {
    console.log("לא נכתב דבר. להחלה: node scripts/fixProductTranslations.mjs --apply");
    return;
  }

  const idToken = await signInAsManager();
  console.log("התחברות כמנהלת הצליחה. מעדכן...\n");

  let updated = 0;

  for (const change of changes) {
    try {
      await updateNameEn(change.docId, change.to, idToken);
      updated++;
      console.log(`  עודכן ${change.code} -> ${change.to}`);
    } catch (error) {
      console.error(`  נכשל ${change.code}: ${error.message}`);
    }
  }

  console.log(`\nהסתיים. עודכנו ${updated} מתוך ${changes.length}.`);
}

run().catch((error) => {
  console.error("\nשגיאה:", error.message);
  process.exit(1);
});
