import { describe, it, expect, beforeEach, vi } from "vitest";

// These tests run in the default node environment, which has no DOM. Rather
// than pull in jsdom for one file, localStorage and the two window APIs
// auth.js touches are stubbed with minimal in-memory equivalents.
const store = new Map();
vi.stubGlobal("localStorage", {
  getItem: (k) => (store.has(String(k)) ? store.get(String(k)) : null),
  setItem: (k, v) => store.set(String(k), String(v)),
  removeItem: (k) => store.delete(String(k)),
  clear: () => store.clear(),
});
vi.stubGlobal("window", {
  location: { search: "", pathname: "/customer" },
  history: { replaceState: () => {} },
});

// auth.js reaches for the sign-out service and the dialog provider, neither of
// which is involved in the identity cache.
vi.mock("../../services/auth/firebaseAuth", () => ({
  logOut: vi.fn(() => Promise.resolve()),
}));
vi.mock("../../components/common/DialogProvider", () => ({
  globalDialog: { confirm: vi.fn(() => Promise.resolve(true)) },
}));

const { syncAuthCache, clearAuthCache, isGuestMode, initAuth } =
  await import("./auth");

const MODE_KEY = "fs_customer_mode";
const USER_KEY = "fs_current_user";

beforeEach(() => {
  localStorage.clear();
  window.location.search = "";
});

describe("syncAuthCache", () => {
  it("writes the email and display name from the Firebase user", () => {
    const result = syncAuthCache({ email: "Dana@Example.com", displayName: "דנה" });

    expect(result).toEqual({ email: "dana@example.com", name: "דנה" });
    expect(localStorage.getItem(MODE_KEY)).toBe("auth");
    expect(JSON.parse(localStorage.getItem(USER_KEY))).toEqual({
      email: "dana@example.com",
      name: "דנה",
    });
  });

  it("normalises the email to lower case", () => {
    const result = syncAuthCache({ email: "  MIXED@Case.COM  ", displayName: null });
    expect(result.email).toBe("mixed@case.com");
  });

  it("falls back to the email prefix when there is no display name", () => {
    const result = syncAuthCache({ email: "noname@example.com", displayName: null });
    expect(result.name).toBe("noname");
  });

  it("overwrites a stale cached identity", () => {
    localStorage.setItem(MODE_KEY, "auth");
    localStorage.setItem(USER_KEY, JSON.stringify({ email: "old@x.com", name: "Old" }));

    syncAuthCache({ email: "new@x.com", displayName: "New" });

    expect(JSON.parse(localStorage.getItem(USER_KEY)).email).toBe("new@x.com");
  });

  it("promotes guest mode to auth once a real user signs in", () => {
    localStorage.setItem(MODE_KEY, "guest");

    syncAuthCache({ email: "real@x.com", displayName: "Real" });

    expect(localStorage.getItem(MODE_KEY)).toBe("auth");
  });
});

describe("clearAuthCache", () => {
  it("removes both identity keys", () => {
    localStorage.setItem(MODE_KEY, "auth");
    localStorage.setItem(USER_KEY, JSON.stringify({ email: "a@b.c", name: "A" }));

    clearAuthCache();

    expect(localStorage.getItem(MODE_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it("is safe to call when nothing is cached", () => {
    expect(() => clearAuthCache()).not.toThrow();
    expect(localStorage.getItem(MODE_KEY)).toBeNull();
  });

  it("leaves unrelated keys alone", () => {
    localStorage.setItem("fs_cart", "[]");
    localStorage.setItem(MODE_KEY, "auth");

    clearAuthCache();

    expect(localStorage.getItem("fs_cart")).toBe("[]");
  });
});

describe("isGuestMode", () => {
  it("is true in guest mode", () => {
    localStorage.setItem(MODE_KEY, "guest");
    expect(isGuestMode()).toBe(true);
  });

  it("is false for a signed-in customer", () => {
    localStorage.setItem(MODE_KEY, "auth");
    expect(isGuestMode()).toBe(false);
  });

  it("is false when nothing is cached", () => {
    expect(isGuestMode()).toBe(false);
  });

  // This guards the bug that would sign every guest out: reading the mode from
  // a LS_KEYS map that has no MODE entry yields undefined, and the guest check
  // silently stops working.
  it("reads the real mode key", () => {
    localStorage.setItem(MODE_KEY, "guest");
    expect(isGuestMode()).toBe(true);
    expect(localStorage.getItem(undefined)).toBeNull();
  });
});

describe("initAuth — cache read", () => {
  it("returns the cached customer", () => {
    localStorage.setItem(MODE_KEY, "auth");
    localStorage.setItem(USER_KEY, JSON.stringify({ email: "a@b.c", name: "A" }));

    expect(initAuth()).toEqual({
      mode: "auth",
      currentUser: { email: "a@b.c", name: "A" },
      isGuest: false,
    });
  });

  it("reports guest mode without a user", () => {
    localStorage.setItem(MODE_KEY, "guest");

    expect(initAuth()).toEqual({ mode: "guest", currentUser: null, isGuest: true });
  });

  it("returns an empty state when nothing is cached", () => {
    expect(initAuth()).toEqual({ mode: null, currentUser: null, isGuest: false });
  });

  it("clears a half-written cache: mode without a user", () => {
    localStorage.setItem(MODE_KEY, "auth");

    const result = initAuth();

    expect(result.mode).toBeNull();
    expect(localStorage.getItem(MODE_KEY)).toBeNull();
  });

  it("round-trips with syncAuthCache", () => {
    syncAuthCache({ email: "round@trip.com", displayName: "Round" });

    expect(initAuth()).toEqual({
      mode: "auth",
      currentUser: { email: "round@trip.com", name: "Round" },
      isGuest: false,
    });
  });

  it("leaves nothing readable after clearAuthCache", () => {
    syncAuthCache({ email: "gone@x.com", displayName: "Gone" });
    clearAuthCache();

    expect(initAuth()).toEqual({ mode: null, currentUser: null, isGuest: false });
  });
});
