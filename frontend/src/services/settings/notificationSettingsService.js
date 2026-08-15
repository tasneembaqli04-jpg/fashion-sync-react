import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const NOTIFICATION_DOC = doc(db, "settings", "notifications");

/**
 * Values used when the document has never been written.
 *
 * demandThreshold matches the constant the alert builder falls back to, so a
 * shop that never opens this screen behaves exactly as it did before the
 * settings existed.
 */
export const DEFAULT_NOTIFICATION_SETTINGS = Object.freeze({
  lowStock: true,
  outOfStock: true,
  highDemand: true,
  demandThreshold: 15,
});

/**
 * Reads the alert preferences.
 *
 * @returns {Promise<{lowStock: boolean, outOfStock: boolean, highDemand: boolean, demandThreshold: number}>}
 * The stored preferences, with defaults filled in for anything missing.
 */
export async function getNotificationSettings() {
  const snapshot = await getDoc(NOTIFICATION_DOC);

  if (!snapshot.exists()) {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }

  const data = snapshot.data() || {};

  return {
    lowStock:
      data.lowStock ?? DEFAULT_NOTIFICATION_SETTINGS.lowStock,
    outOfStock:
      data.outOfStock ?? DEFAULT_NOTIFICATION_SETTINGS.outOfStock,
    highDemand:
      data.highDemand ?? DEFAULT_NOTIFICATION_SETTINGS.highDemand,
    demandThreshold:
      Number(data.demandThreshold) > 0 ?
        Number(data.demandThreshold) :
        DEFAULT_NOTIFICATION_SETTINGS.demandThreshold,
  };
}

/**
 * Stores the alert preferences.
 *
 * @param {object} settings - The preferences to store.
 * @returns {Promise<void>}
 */
export async function setNotificationSettings(settings) {
  await setDoc(
    NOTIFICATION_DOC,
    {
      lowStock: Boolean(settings.lowStock),
      outOfStock: Boolean(settings.outOfStock),
      highDemand: Boolean(settings.highDemand),
      demandThreshold:
        Number(settings.demandThreshold) > 0 ?
          Math.round(Number(settings.demandThreshold)) :
          DEFAULT_NOTIFICATION_SETTINGS.demandThreshold,
    },
    { merge: true }
  );
}
