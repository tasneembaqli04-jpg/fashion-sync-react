/**
 * סקריפט חד-פעמי לתיקון שדה nameEn של מוצרים ב-Firestore.
 *
 * הסקריפט אינו חלק מקוד הפרודקשן — הוא יושב מחוץ ל-frontend/src
 * ולכן לא נכלל בבנייה של Vite.
 *
 * מקור האמת הוא translationService.js עצמו: הסקריפט מייבא ממנו את
 * המילון ואת פונקציות התיקון, כדי שלא תיווצר כפילות בין הסקריפט
 * לבין ההתנהגות באפליקציה.
 *
 * הרצה:
 *   node scripts/fixProductTranslations.mjs            → תצוגה בלבד
 *   node scripts/fixProductTranslations.mjs --apply    → כתיבה בפועל
 *
 * לכתיבה נדרשות הרשאות מנהלת, שמועברות במשתני סביבה:
 *   FS_MANAGER_EMAIL, FS_MANAGER_PASSWORD
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
 * ממירה ערך בפורמט Firestore REST לערך JS רגיל.
 *
 * @param {object} value - הערך בפורמט REST.
 * @returns {*} הערך המפוענח.
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
 * שולפת את כל המוצרים מ-Firestore.
 *
 * @returns {Promise<object[]>} רשימת המוצרים.
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
 * מתחברת כמנהלת ומחזירה טוקן זיהוי.
 *
 * עדכון nameEn מחייב הרשאות מנהלת לפי firestore.rules.
 *
 * @returns {Promise<string>} טוקן הזיהוי.
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
 * מעדכנת שדה nameEn של מוצר בודד.
 *
 * updateMask מבטיח שרק nameEn ייכתב — שום שדה אחר לא נוגע.
 *
 * @param {string} docId - מזהה המסמך.
 * @param {string} nameEn - השם החדש באנגלית.
 * @param {string} idToken - טוקן המנהלת.
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
 * מחשבת את השם המתוקן עבור מוצר.
 *
 * שכבה 1 — התאמה מדויקת במילון.
 * שכבה 3 — תיקוני ניסוח ו-Title Case על התרגום הקיים.
 *
 * הסקריפט לא פונה ל-API של התרגום: הוא עובד על מה שכבר שמור.
 *
 * @param {object} product - המוצר מ-Firestore.
 * @returns {{nextName: string, source: string}} השם המוצע ומקורו.
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
 * מריצה את התהליך.
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
