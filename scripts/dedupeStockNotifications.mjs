/**
 * One-off cleanup of duplicate "notify me when back in stock" requests.
 *
 * The application used to write a new document on every press of the notify
 * button, so a customer who pressed four times on the same product created
 * four requests. Each one then produced its own email and its own banner when
 * the product returned, and each counted separately towards the manager's
 * pending figure. New requests are deduplicated in the application; this
 * clears what was already stored.
 *
 * Only unresolved requests are considered. A request that has already been
 * answered is a record of something that happened: it sends nothing, and
 * deleting it would erase history rather than fix a defect.
 *
 * Within each group of duplicates the earliest request is kept, since that is
 * when the customer actually asked, and the rest are deleted.
 *
 * This is not production code: it lives outside frontend/src, so Vite never
 * includes it in the build.
 *
 * Usage:
 *   node scripts/dedupeStockNotifications.mjs            report only, writes nothing
 *   node scripts/dedupeStockNotifications.mjs --apply    deletes the duplicates
 *
 * The default run is read-only.
 *
 * Reading and deleting requires manager permissions, supplied through
 * environment variables: FS_MANAGER_EMAIL and FS_MANAGER_PASSWORD.
 */

import {
  splitDuplicateAlerts,
  stockAlertKey,
} from "../frontend/src/functions/customer/stockAlertPolicy.js";

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
  if ("timestampValue" in value) return value.timestampValue;
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
      "Missing environment variables FS_MANAGER_EMAIL and FS_MANAGER_PASSWORD",
    );
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Sign-in failed: ${body?.error?.message || response.status}`);
  }

  return body.idToken;
}

/**
 * Fetches the whole stockNotifications collection.
 *
 * @param {string} idToken - Manager ID token.
 * @returns {Promise<object[]>} Documents, each carrying its id as __id.
 */
async function fetchStockNotifications(idToken) {
  const documents = [];
  let pageToken = "";

  do {
    const url =
      `${FIRESTORE_BASE}/stockNotifications?pageSize=300` +
      (pageToken ? `&pageToken=${pageToken}` : "") +
      `&key=${API_KEY}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (!response.ok) {
      throw new Error(`Reading stockNotifications failed: ${response.status}`);
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
 * Deletes one request.
 *
 * @param {string} docId - Document id.
 * @param {string} idToken - Manager ID token.
 * @returns {Promise<void>}
 */
async function deleteRequest(docId, idToken) {
  const response = await fetch(
    `${FIRESTORE_BASE}/stockNotifications/${docId}?key=${API_KEY}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${idToken}` },
    },
  );

  if (!response.ok) {
    throw new Error(`Deleting ${docId} failed: ${response.status}`);
  }
}

async function main() {
  const idToken = await signInAsManager();
  const requests = await fetchStockNotifications(idToken);

  const answered = requests.filter((r) => r.notified).length;

  // The same rule the application applies, imported rather than repeated, so
  // the script cannot decide differently from the code it cleans up after.
  const { keep, remove } = splitDuplicateAlerts(requests);

  console.log(`stockNotifications: ${requests.length} total`);
  console.log(`  already answered, left untouched: ${answered}`);
  console.log(`  unanswered: ${requests.length - answered}`);
  console.log(`  customer-and-product pairs waiting: ${keep.length}`);
  console.log(`  requests that would be deleted: ${remove.length}
`);

  if (!remove.length) {
    console.log("No duplicates to clean up.");
    return;
  }

  // Regrouped for the report only, so each line shows what is kept and why.
  for (const kept of keep) {
    const key = stockAlertKey(kept);
    const extra = remove.filter((r) => stockAlertKey(r) === key);
    if (!extra.length) continue;

    const [email, code] = key.split(" ");
    console.log(`${email}  ${code}  — ${extra.length + 1} requests`);
    console.log(`    keep   ${kept.__id}  ${kept.createdAt || "(no date)"}`);
    for (const request of extra) {
      console.log(`    delete ${request.__id}  ${request.createdAt || "(no date)"}`);
    }
  }

  if (!APPLY) {
    console.log("\nDry run — nothing was written. Pass --apply to delete.");
    return;
  }

  console.log("");
  let deleted = 0;

  for (const request of remove) {
    // Each deletion stands alone: one failure should not stop the rest, and a
    // request left behind is merely a duplicate that can be cleared next run.
    try {
      await deleteRequest(request.__id, idToken);
      deleted += 1;
    } catch (err) {
      console.warn(`  could not delete ${request.__id}: ${err.message}`);
    }
  }

  console.log(`Deleted ${deleted} of ${remove.length} duplicates.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
