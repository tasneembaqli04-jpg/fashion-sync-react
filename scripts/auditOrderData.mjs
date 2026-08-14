/**
 * One-off audit of the order, gift card and product data already in Firestore.
 *
 * The calculation fixes in the application change how new records are written.
 * This script reports what the existing records look like, and optionally
 * repairs the two classes of defect that are safe to repair automatically.
 *
 * This is not production code: it lives outside frontend/src, so Vite never
 * includes it in the build.
 *
 * roundMoney is imported from the application rather than reimplemented, so a
 * value this script writes is identical to what checkout would write today.
 *
 * Usage:
 *   node scripts/auditOrderData.mjs            report only, writes nothing
 *   node scripts/auditOrderData.mjs --apply    applies the money rounding
 *
 * The default run is read-only. Even with --apply, the salesLastMonth
 * realignment stays off unless --fix-sales is passed as well, because that
 * counter is cumulative by design and the right target value is a business
 * decision rather than an arithmetic one.
 *
 * Reading orders and gift cards requires manager permissions, supplied through
 * environment variables: FS_MANAGER_EMAIL and FS_MANAGER_PASSWORD.
 */
import { roundMoney } from "../frontend/src/utils/money.js";

const PROJECT_ID = "fashionsync-dc79f";
const API_KEY = "AIzaSyDHp13Aaycgle5W4EDIN0t4vA_9c1rDk4M";

const APPLY = process.argv.includes("--apply");
const FIX_SALES = process.argv.includes("--fix-sales");

const FIRESTORE_BASE =
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
  `/databases/(default)/documents`;

/** Money fields carried on an order document. */
const ORDER_MONEY_FIELDS = [
  "total",
  "subtotal",
  "discountAmount",
  "pointsDiscountAmount",
  "shippingCost",
];

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
  if ("timestampValue" in value) return value.timestampValue;
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
 * Signs in as the manager and returns an ID token.
 *
 * @returns {Promise<string>} The manager ID token.
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

  if (!response.ok) {
    throw new Error(`התחברות נכשלה: ${body?.error?.message || response.status}`);
  }

  return body.idToken;
}

/**
 * Fetches an entire collection.
 *
 * @param {string} collection - Collection name.
 * @param {string|null} idToken - Manager ID token, or null for public reads.
 * @returns {Promise<object[]>} The documents, each carrying its id as __id.
 */
async function fetchCollection(collection, idToken) {
  const documents = [];
  let pageToken = "";

  do {
    const url =
      `${FIRESTORE_BASE}/${collection}?pageSize=300` +
      (pageToken ? `&pageToken=${pageToken}` : "") +
      `&key=${API_KEY}`;

    const response = await fetch(url, {
      headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
    });

    if (!response.ok) {
      throw new Error(`קריאת ${collection} נכשלה: ${response.status}`);
    }

    const data = await response.json();

    for (const document of data.documents || []) {
      const record = { __id: document.name.split("/").pop() };
      for (const [key, value] of Object.entries(document.fields || {})) {
        record[key] = decode(value);
      }
      documents.push(record);
    }

    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return documents;
}

/**
 * Writes specific numeric fields of a document, leaving every other field
 * untouched.
 *
 * updateMask is what guarantees that: without it, Firestore replaces the whole
 * document with the payload.
 *
 * @param {string} collection - Collection name.
 * @param {string} docId - Document id.
 * @param {object} numericFields - Field name to numeric value.
 * @param {string} idToken - Manager ID token.
 * @returns {Promise<void>}
 */
async function updateNumericFields(collection, docId, numericFields, idToken) {
  const names = Object.keys(numericFields);
  const mask = names
    .map((name) => `updateMask.fieldPaths=${encodeURIComponent(name)}`)
    .join("&");

  const url =
    `${FIRESTORE_BASE}/${collection}/${encodeURIComponent(docId)}` +
    `?${mask}&key=${API_KEY}`;

  const fields = {};
  for (const [name, value] of Object.entries(numericFields)) {
    fields[name] = { doubleValue: value };
  }

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`עדכון ${collection}/${docId} נכשל: ${body.slice(0, 160)}`);
  }
}

/**
 * Whether a number carries more precision than two decimal places.
 *
 * @param {*} value - Value to test.
 * @returns {boolean} true when the value has float residue.
 */
function hasFloatNoise(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value * 100 - Math.round(value * 100)) > 1e-9
  );
}

const heading = (text) =>
  console.log(`\n${"─".repeat(74)}\n${text}\n${"─".repeat(74)}`);

async function main() {
  console.log(
    APPLY
      ? "מצב כתיבה (--apply)\n"
      : "מצב תצוגה בלבד. שום דבר לא ייכתב. הוסיפי --apply כדי לכתוב.\n"
  );

  const idToken = await signInAsManager();

  const [orders, giftCards, products] = await Promise.all([
    fetchCollection("orders", idToken),
    fetchCollection("giftCards", idToken),
    fetchCollection("products", idToken),
  ]);

  console.log(
    `נסרקו ${orders.length} הזמנות, ${giftCards.length} כרטיסי מתנה, ` +
      `${products.length} מוצרים`
  );

  const orderRepairs = [];
  const giftCardRepairs = [];

  // ── 1. Float residue in order money fields ─────────────────────────────
  heading("1. הזמנות עם רעש נקודה צפה");

  for (const order of orders) {
    const changes = {};

    for (const field of ORDER_MONEY_FIELDS) {
      if (hasFloatNoise(order[field])) {
        changes[field] = roundMoney(order[field]);
      }
    }

    if (Object.keys(changes).length) {
      orderRepairs.push({ order, changes });
    }
  }

  if (!orderRepairs.length) {
    console.log("  ✓ אין. כל הערכים הכספיים בהזמנות תקינים.");
  } else {
    console.log(`  ✗ ${orderRepairs.length} הזמנות:\n`);
    for (const { order, changes } of orderRepairs) {
      console.log(`  ${order.id || order.__id}   (${order.date || "ללא תאריך"})`);
      for (const [field, next] of Object.entries(changes)) {
        console.log(
          `      ${field.padEnd(22)} ${String(order[field]).padEnd(24)} → ${next}`
        );
      }
    }
  }

  // ── 2. Float residue in gift card balances ─────────────────────────────
  heading("2. כרטיסי מתנה עם רעש נקודה צפה");

  for (const card of giftCards) {
    const changes = {};

    if (hasFloatNoise(card.balance)) changes.balance = roundMoney(card.balance);
    if (hasFloatNoise(card.amount)) changes.amount = roundMoney(card.amount);

    if (Object.keys(changes).length) {
      giftCardRepairs.push({ card, changes });
    }
  }

  if (!giftCardRepairs.length) {
    console.log("  ✓ אין. כל היתרות תקינות.");
  } else {
    console.log(`  ✗ ${giftCardRepairs.length} כרטיסים:\n`);
    for (const { card, changes } of giftCardRepairs) {
      console.log(`  ${card.__id}   סטטוס: ${card.status}`);
      for (const [field, next] of Object.entries(changes)) {
        console.log(
          `      ${field.padEnd(22)} ${String(card[field]).padEnd(24)} → ${next}`
        );
      }
    }
  }

  // A spent card whose residue keeps it marked active is worth flagging even
  // when the balance itself rounds cleanly.
  const stuckActive = giftCards.filter(
    (card) =>
      card.status === "active" &&
      Number(card.balance) > 0 &&
      roundMoney(card.balance) === 0
  );

  if (stuckActive.length) {
    console.log(
      `\n  ⚠ ${stuckActive.length} כרטיסים פעילים שיתרתם מתעגלת ל-0:`
    );
    stuckActive.forEach((card) =>
      console.log(`      ${card.__id}  יתרה=${card.balance}`)
    );
  }

  // ── 3. salesLastMonth against the orders ───────────────────────────────
  heading("3. salesLastMonth מול המכירות בפועל");

  const soldByCode = new Map();
  const soldByCodeExcludingCancelled = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      if (item.isGiftCard || !item.code) continue;

      const qty = Number(item.qty) || 0;
      soldByCode.set(item.code, (soldByCode.get(item.code) || 0) + qty);

      if (!order.cancelled) {
        soldByCodeExcludingCancelled.set(
          item.code,
          (soldByCodeExcludingCancelled.get(item.code) || 0) + qty
        );
      }
    }
  }

  const salesGaps = [];

  for (const product of products) {
    const counter = Number(product.salesLastMonth) || 0;
    const allOrders = soldByCode.get(product.__id) || 0;
    const activeOrders = soldByCodeExcludingCancelled.get(product.__id) || 0;

    if (counter !== allOrders) {
      salesGaps.push({ code: product.__id, counter, allOrders, activeOrders });
    }
  }

  const counterTotal = products.reduce(
    (sum, p) => sum + (Number(p.salesLastMonth) || 0),
    0
  );
  const ordersTotal = [...soldByCode.values()].reduce((a, b) => a + b, 0);
  const activeTotal = [...soldByCodeExcludingCancelled.values()].reduce(
    (a, b) => a + b,
    0
  );

  console.log(`  סך salesLastMonth על פני המוצרים:        ${counterTotal}`);
  console.log(`  סך היחידות בכל ההזמנות:                  ${ordersTotal}`);
  console.log(`  סך היחידות בהזמנות שלא בוטלו:            ${activeTotal}`);

  if (!salesGaps.length) {
    console.log("\n  ✓ כל מונה תואם להזמנות.");
  } else {
    console.log(`\n  ✗ ${salesGaps.length} מוצרים עם פער:\n`);
    console.log(
      "    קוד        המונה   כל ההזמנות   ללא מבוטלות   הפרש מול כל ההזמנות"
    );
    for (const gap of salesGaps) {
      const diff = gap.counter - gap.allOrders;
      console.log(
        `    ${gap.code.padEnd(10)} ${String(gap.counter).padStart(5)}   ` +
          `${String(gap.allOrders).padStart(10)}   ` +
          `${String(gap.activeOrders).padStart(11)}   ` +
          `${diff > 0 ? "+" : ""}${diff}`
      );
    }
    console.log(
      "\n  המונה מצטבר לפי התכנון ואינו יורד בביטול או בהחזרה, ולכן פער חיובי" +
        "\n  בגודל של ביטול הוא ההתנהגות המתועדת ולא נתון פגום." +
        "\n  פער גדול בהרבה מכך מקורו בנתוני זריעה שנכתבו בלי הזמנה מאחוריהם." +
        "\n  --fix-sales מיישר לעמודת 'ללא מבוטלות', משום שהזמנה שבוטלה החזירה" +
        "\n  את מלאיה ואינה מכירה."
    );
  }

  // ── 4. Orders with an empty items array ────────────────────────────────
  heading("4. הזמנות עם מערך פריטים ריק");

  const emptyItems = orders.filter(
    (order) => Array.isArray(order.items) && order.items.length === 0
  );
  const missingItems = orders.filter((order) => !Array.isArray(order.items));

  if (!emptyItems.length && !missingItems.length) {
    console.log("  ✓ אין.");
  } else {
    if (emptyItems.length) {
      console.log(`  ✗ ${emptyItems.length} הזמנות עם items ריק:`);
      emptyItems.forEach((order) =>
        console.log(
          `      ${order.id || order.__id}  total=${order.total}  ${order.date || ""}`
        )
      );
    }
    if (missingItems.length) {
      console.log(`  ✗ ${missingItems.length} הזמנות ללא שדה items כלל:`);
      missingItems.forEach((order) =>
        console.log(`      ${order.id || order.__id}  total=${order.total}`)
      );
    }
  }

  // ── 5. Orders missing a usable date ────────────────────────────────────
  heading("5. הזמנות ללא תאריך שמיש");

  const usable = (value) =>
    value !== null &&
    value !== undefined &&
    value !== "" &&
    !Number.isNaN(new Date(value).getTime());

  const noDate = orders.filter(
    (order) => !usable(order.date) && !usable(order.createdAt)
  );
  const onlyCreatedAt = orders.filter(
    (order) => !usable(order.date) && usable(order.createdAt)
  );
  const onlyDate = orders.filter(
    (order) => usable(order.date) && !usable(order.createdAt)
  );

  console.log(`  ללא שני השדות (חלונות ביטול והחזרה ייסגרו): ${noDate.length}`);
  noDate.forEach((order) => console.log(`      ${order.id || order.__id}`));

  console.log(`  עם createdAt בלבד: ${onlyCreatedAt.length}`);
  onlyCreatedAt.forEach((order) => console.log(`      ${order.id || order.__id}`));

  console.log(`  עם date בלבד: ${onlyDate.length}`);
  onlyDate.forEach((order) => console.log(`      ${order.id || order.__id}`));

  // ── Repair plan ────────────────────────────────────────────────────────
  heading("תוכנית התיקון");

  const totalRepairs = orderRepairs.length + giftCardRepairs.length;

  console.log(`  עיגול ערכים כספיים בהזמנות:      ${orderRepairs.length}`);
  console.log(`  עיגול יתרות בכרטיסי מתנה:        ${giftCardRepairs.length}`);
  console.log(
    `  יישור salesLastMonth:            ${
      FIX_SALES ? salesGaps.length : `${salesGaps.length} (כבוי — דורש --fix-sales)`
    }`
  );

  if (!APPLY) {
    console.log(
      `\n  לא נכתב דבר. להרצה בפועל:\n    node scripts/auditOrderData.mjs --apply`
    );
    return;
  }

  if (!totalRepairs && !(FIX_SALES && salesGaps.length)) {
    console.log("\n  אין מה לתקן.");
    return;
  }

  console.log("\n  כותב...\n");

  for (const { order, changes } of orderRepairs) {
    await updateNumericFields("orders", order.__id, changes, idToken);
    console.log(`  ✓ orders/${order.id || order.__id}`);
  }

  for (const { card, changes } of giftCardRepairs) {
    await updateNumericFields("giftCards", card.__id, changes, idToken);
    console.log(`  ✓ giftCards/${card.__id}`);
  }

  if (FIX_SALES) {
    // Aligned to the orders that were not cancelled. A cancelled order returns
    // its stock, so counting it as a sale would leave the counter disagreeing
    // with the inventory it is displayed next to.
    for (const gap of salesGaps) {
      await updateNumericFields(
        "products",
        gap.code,
        { salesLastMonth: gap.activeOrders },
        idToken
      );
      console.log(
        `  ✓ products/${gap.code}  salesLastMonth ${gap.counter} → ${gap.activeOrders}`
      );
    }
  }

  console.log("\n  הסתיים.");
}

main().catch((error) => {
  console.error(`\nשגיאה: ${error.message}`);
  process.exit(1);
});
