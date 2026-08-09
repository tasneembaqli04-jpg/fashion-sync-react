import { db } from "../../firebase";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

const HOURS_DOC = doc(
  db,
  "settings",
  "businessHours"
);

export const DEFAULT_DAYS = [
  {
    key: "sun",
    open: true,
    openTime: "09:00",
    closeTime: "18:00",
  },
  {
    key: "mon",
    open: true,
    openTime: "09:00",
    closeTime: "18:00",
  },
  {
    key: "tue",
    open: true,
    openTime: "09:00",
    closeTime: "18:00",
  },
  {
    key: "wed",
    open: true,
    openTime: "09:00",
    closeTime: "18:00",
  },
  {
    key: "thu",
    open: true,
    openTime: "09:00",
    closeTime: "18:00",
  },
  {
    key: "fri",
    open: false,
    openTime: "09:00",
    closeTime: "14:00",
  },
  {
    key: "sat",
    open: false,
    openTime: "09:00",
    closeTime: "18:00",
  },
];

export async function getBusinessHours() {
  let snapshot;

  try {
    snapshot = await getDoc(HOURS_DOC);
  } catch (err) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    snapshot = await getDoc(HOURS_DOC);
  }

  if (!snapshot.exists()) {
    return {
      days: DEFAULT_DAYS,
    };
  }

  const data = snapshot.data();

  return {
    days: DEFAULT_DAYS.map((defaultDay) => {
      const savedDay = Array.isArray(data?.days)
        ? data.days.find(
            (day) => day?.key === defaultDay.key
          )
        : null;

      return {
        ...defaultDay,
        ...savedDay,
      };
    }),
  };
}

export async function setBusinessHours({
  days,
}) {
  const normalizedDays = Array.isArray(days)
    ? days.map((day) => ({
        key: day.key,
        open: Boolean(day.open),

        // שומר את השעות שהמנהל בחר.
        openTime:
          day.openTime || "09:00",

        closeTime:
          day.closeTime || "18:00",
      }))
    : DEFAULT_DAYS;

  await setDoc(HOURS_DOC, {
    days: normalizedDays,
  });
}