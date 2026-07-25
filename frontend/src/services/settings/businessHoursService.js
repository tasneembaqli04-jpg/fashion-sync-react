import { db } from "../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const HOURS_DOC = doc(db, "settings", "businessHours");

export const DEFAULT_DAYS = [
  { key: "sun", open: true, openTime: "09:00", closeTime: "18:00" },
  { key: "mon", open: true, openTime: "09:00", closeTime: "18:00" },
  { key: "tue", open: true, openTime: "09:00", closeTime: "18:00" },
  { key: "wed", open: true, openTime: "09:00", closeTime: "18:00" },
  { key: "thu", open: true, openTime: "09:00", closeTime: "18:00" },
  { key: "fri", open: false, openTime: "09:00", closeTime: "14:00" },
  { key: "sat", open: false, openTime: "09:00", closeTime: "18:00" },
];

export async function getBusinessHours() {
  const snapshot = await getDoc(HOURS_DOC);

  if (!snapshot.exists()) {
    return { days: DEFAULT_DAYS };
  }

  const data = snapshot.data();

  return {
    days: Array.isArray(data.days) ? data.days : DEFAULT_DAYS,
  };
}

export async function setBusinessHours({ days }) {
  await setDoc(HOURS_DOC, { days });
}