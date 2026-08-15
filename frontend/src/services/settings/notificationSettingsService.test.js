import { describe, it, expect, beforeEach, vi } from "vitest";

const store = new Map();

vi.mock("../../firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, collection, id) => ({ id: `${collection}/${id}` })),
  getDoc: vi.fn(async (ref) => {
    const data = store.get(ref.id);
    return { exists: () => data !== undefined, data: () => data };
  }),
  setDoc: vi.fn(async (ref, payload, options) => {
    store.set(
      ref.id,
      options?.merge ? { ...store.get(ref.id), ...payload } : payload
    );
  }),
}));

const {
  getNotificationSettings,
  setNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} = await import("./notificationSettingsService");

const DOC = "settings/notifications";

beforeEach(() => {
  store.clear();
});

describe("absence never silences an alert", () => {
  // A shop that has never opened the settings screen must keep every alert it
  // had before the screen existed. Silence caused by a missing document would
  // be invisible: no error, no warning, just alerts that stop appearing.
  it("turns everything on when the document does not exist", async () => {
    const settings = await getNotificationSettings();

    expect(settings.lowStock).toBe(true);
    expect(settings.outOfStock).toBe(true);
    expect(settings.highDemand).toBe(true);
    expect(settings.demandThreshold).toBe(15);
  });

  it("turns everything on when the document exists but is empty", async () => {
    store.set(DOC, {});
    const settings = await getNotificationSettings();

    expect(settings.lowStock).toBe(true);
    expect(settings.outOfStock).toBe(true);
    expect(settings.highDemand).toBe(true);
  });

  it("fills in only the fields that are missing", async () => {
    store.set(DOC, { lowStock: false });
    const settings = await getNotificationSettings();

    expect(settings.lowStock).toBe(false);
    expect(settings.outOfStock).toBe(true);
    expect(settings.highDemand).toBe(true);
  });

  it("treats a null field as unset rather than as off", async () => {
    store.set(DOC, { lowStock: null, outOfStock: null });
    const settings = await getNotificationSettings();

    expect(settings.lowStock).toBe(true);
    expect(settings.outOfStock).toBe(true);
  });

  it("falls back to the default threshold for a missing or absurd value", async () => {
    for (const stored of [{}, { demandThreshold: 0 }, { demandThreshold: -5 }, { demandThreshold: "abc" }]) {
      store.set(DOC, stored);
      const settings = await getNotificationSettings();
      expect(settings.demandThreshold).toBe(15);
    }
  });

  it("exposes the defaults as an immutable object", () => {
    expect(DEFAULT_NOTIFICATION_SETTINGS.lowStock).toBe(true);
    expect(Object.isFrozen(DEFAULT_NOTIFICATION_SETTINGS)).toBe(true);
  });
});

describe("switching alerts off is stored and read back", () => {
  it("stores each switch independently", async () => {
    for (const field of ["lowStock", "outOfStock", "highDemand"]) {
      store.clear();

      await setNotificationSettings({
        lowStock: true,
        outOfStock: true,
        highDemand: true,
        demandThreshold: 15,
        [field]: false,
      });

      const settings = await getNotificationSettings();
      expect(settings[field]).toBe(false);

      for (const other of ["lowStock", "outOfStock", "highDemand"]) {
        if (other !== field) expect(settings[other]).toBe(true);
      }
    }
  });

  it("stores a custom threshold", async () => {
    await setNotificationSettings({
      lowStock: true,
      outOfStock: true,
      highDemand: true,
      demandThreshold: 30,
    });

    expect((await getNotificationSettings()).demandThreshold).toBe(30);
  });

  it("rounds a fractional threshold", async () => {
    await setNotificationSettings({ demandThreshold: 22.6 });
    expect((await getNotificationSettings()).demandThreshold).toBe(23);
  });

  it("refuses to store a threshold of zero", async () => {
    await setNotificationSettings({ demandThreshold: 0 });
    expect((await getNotificationSettings()).demandThreshold).toBe(15);
  });

  it("survives a reload, which component state did not", async () => {
    await setNotificationSettings({
      lowStock: false,
      outOfStock: true,
      highDemand: true,
      demandThreshold: 25,
    });

    const first = await getNotificationSettings();
    const second = await getNotificationSettings();

    expect(second).toEqual(first);
    expect(second.lowStock).toBe(false);
    expect(second.demandThreshold).toBe(25);
  });
});
