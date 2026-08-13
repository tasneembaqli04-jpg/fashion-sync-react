import { db } from "../../firebase";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
} from "firebase/firestore";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Creates or updates a customer profile document.
 *
 * Fields are written from an explicit whitelist rather than by spreading the
 * incoming object. That matters because the same document also holds
 * loyaltyPoints: spreading a caller-supplied object here would let a checkout
 * payload overwrite a points balance. Only profile and address fields can be
 * touched through this function.
 *
 * The document id is the normalized email, which is what the Firestore owner
 * check in the rules compares against.
 *
 * @param {object} customer - Customer profile, must include an email.
 * @returns {Promise<void>}
 * @throws {Error} When the email is missing.
 */
export async function saveCustomer(customer) {
  const email = normalizeEmail(customer?.email);

  if (!email) {
    throw new Error("Customer email is missing");
  }

  await setDoc(
    doc(db, "customers", email),
    {
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      name: customer.name || "",
      nameEn: customer.nameEn || "",
      email,
      phone: customer.phone || "",
      street: customer.street || "",
      streetEn: customer.streetEn || "",
      city: customer.city || "",
      cityEn: customer.cityEn || "",
      zip: customer.zip || "",
      notes: customer.notes || "",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
export async function updateCustomerNameTranslation(email, nameEn) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  await setDoc(
    doc(db, "customers", normalizedEmail),
    { nameEn: nameEn || "" },
    { merge: true }
  );
}
export async function updateCustomerAddressTranslation(email, { cityEn, streetEn }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  const updates = {};
  if (cityEn !== undefined) updates.cityEn = cityEn || "";
  if (streetEn !== undefined) updates.streetEn = streetEn || "";

  if (Object.keys(updates).length === 0) return;

  await setDoc(doc(db, "customers", normalizedEmail), updates, { merge: true });
}
export async function getCustomer(email) {
  const customerRef = doc(db, "customers", normalizeEmail(email));
  const snapshot = await getDoc(customerRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}
export async function getLoyaltyPoints(email) {
  const customer = await getCustomer(email);
  return Number(customer?.loyaltyPoints) || 0;
}

/**
 * Awards loyalty points for a completed order.
 *
 * The rate is one point per shekel of the order total, rounded to a whole
 * number. Points are read and then written back, without a transaction, so two
 * orders completing at the same moment can lose one of the awards. This is
 * acceptable at the current scale and is one of the reasons the checkout flow
 * is planned to move server-side.
 *
 * The caller decides whether an order earns points at all — gift card only
 * orders are excluded by addOrder.
 *
 * @param {string} email - Customer email.
 * @param {number} orderTotal - Order total in shekels.
 * @returns {Promise<void>}
 */
export async function addLoyaltyPoints(email, orderTotal) {
  const customerEmail = normalizeEmail(email);
  if (!customerEmail) return;

  const customerRef = doc(db, "customers", customerEmail);
  const current = await getLoyaltyPoints(customerEmail);
  const earned = Math.round(Number(orderTotal) || 0);

  await setDoc(
    customerRef,
    { loyaltyPoints: current + earned },
    { merge: true }
  );
}

/**
 * Deducts redeemed loyalty points from a customer balance.
 *
 * The new balance is clamped at zero, so redeeming more points than the
 * customer holds empties the balance instead of going negative. Note that the
 * amount actually discounted at checkout is currently read from localStorage
 * and is not validated against this balance — server-side validation is the
 * planned fix.
 *
 * @param {string} email - Customer email.
 * @param {number} pointsToDeduct - Points the customer redeemed.
 * @returns {Promise<void>}
 */
export async function redeemLoyaltyPoints(email, pointsToDeduct) {
  const customerEmail = normalizeEmail(email);
  if (!customerEmail) return;

  const customerRef = doc(db, "customers", customerEmail);
  const current = await getLoyaltyPoints(customerEmail);
  const newBalance = Math.max(0, current - Math.round(Number(pointsToDeduct) || 0));

  await setDoc(customerRef, { loyaltyPoints: newBalance }, { merge: true });
}

export async function getAllCustomers() {
  const snapshot = await getDocs(collection(db, "customers"));

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}