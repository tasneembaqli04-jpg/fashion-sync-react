import { db } from "../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { translateText } from "../translation/translationService";

const POLICY_DOC = doc(db, "settings", "policyContent");

const FIELDS = [
  "returnsText",
  "shippingLine1",
  "shippingLine2",
  "shippingLine3",
  "shippingLine4",
  "privacyLine1",
  "contactPhone",
];

export async function getPolicyContent() {
  const snapshot = await getDoc(POLICY_DOC);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function setPolicyContent(values) {
  const payload = {};

  FIELDS.forEach((field) => {
    payload[field] = values[field] || "";
    payload[`${field}En`] = values[`${field}En`] || "";
  });

  await setDoc(POLICY_DOC, payload);

  return payload;
}

export async function translatePolicyFields(values) {
  const translations = await Promise.all(
    FIELDS.map((field) => translateText(values[field] || ""))
  );

  const result = {};
  FIELDS.forEach((field, index) => {
    result[`${field}En`] = translations[index] || values[field] || "";
  });

  return result;
}