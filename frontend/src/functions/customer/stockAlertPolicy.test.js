import { describe, it, expect } from "vitest";
import {
  stockAlertKey,
  isAwaitingRestock,
  alreadyWaiting,
  splitDuplicateAlerts,
} from "./stockAlertPolicy";

function request(overrides = {}) {
  return {
    email: "shopper@gmail.com",
    productCode: "FS-001",
    notified: false,
    createdAt: "2026-08-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("stockAlertKey", () => {
  it("treats the same address typed differently as one customer", () => {
    expect(stockAlertKey({ email: "Shopper@Gmail.com ", productCode: "FS-001" })).toBe(
      stockAlertKey({ email: "shopper@gmail.com", productCode: "FS-001" }),
    );
  });

  it("separates different products for the same customer", () => {
    expect(stockAlertKey(request({ productCode: "FS-002" }))).not.toBe(
      stockAlertKey(request()),
    );
  });

  it("returns nothing when either half is missing", () => {
    expect(stockAlertKey({ email: "", productCode: "FS-001" })).toBe("");
    expect(stockAlertKey({ email: "a@b.com", productCode: "" })).toBe("");
    expect(stockAlertKey(null)).toBe("");
  });
});

describe("isAwaitingRestock", () => {
  it("counts a request nobody has answered", () => {
    expect(isAwaitingRestock(request())).toBe(true);
  });

  // The trap the whole design turns on: an answered request must not block a
  // new one, or a customer told in one season could never ask again.
  it("does not count a request that has been answered", () => {
    expect(isAwaitingRestock(request({ notified: true }))).toBe(false);
  });
});

describe("alreadyWaiting", () => {
  it("finds her existing unanswered request", () => {
    expect(alreadyWaiting([request()], "shopper@gmail.com", "FS-001")).toBe(true);
  });

  it("lets her ask again once the previous one was answered", () => {
    const answered = [request({ notified: true })];
    expect(alreadyWaiting(answered, "shopper@gmail.com", "FS-001")).toBe(false);
  });

  it("does not confuse another customer's request for hers", () => {
    const someoneElse = [request({ email: "other@gmail.com" })];
    expect(alreadyWaiting(someoneElse, "shopper@gmail.com", "FS-001")).toBe(false);
  });

  it("does not confuse another product for this one", () => {
    expect(alreadyWaiting([request()], "shopper@gmail.com", "FS-002")).toBe(false);
  });

  it("matches however the address was typed", () => {
    expect(alreadyWaiting([request()], "  Shopper@Gmail.com ", "FS-001")).toBe(true);
  });

  it("survives an empty or missing list", () => {
    expect(alreadyWaiting([], "shopper@gmail.com", "FS-001")).toBe(false);
    expect(alreadyWaiting(null, "shopper@gmail.com", "FS-001")).toBe(false);
  });
});

describe("splitDuplicateAlerts", () => {
  // The reported defect: four presses on one product produced four requests,
  // four emails and four banners.
  it("keeps one of four presses on the same product", () => {
    const four = [
      request({ createdAt: "2026-08-01T10:00:00.000Z" }),
      request({ createdAt: "2026-08-01T10:00:02.000Z" }),
      request({ createdAt: "2026-08-01T10:00:04.000Z" }),
      request({ createdAt: "2026-08-01T10:00:06.000Z" }),
    ];

    const { keep, remove } = splitDuplicateAlerts(four);

    expect(keep).toHaveLength(1);
    expect(remove).toHaveLength(3);
  });

  it("keeps the earliest, which is when she actually asked", () => {
    const out = splitDuplicateAlerts([
      request({ createdAt: "2026-08-01T10:00:06.000Z" }),
      request({ createdAt: "2026-08-01T10:00:00.000Z" }),
      request({ createdAt: "2026-08-01T10:00:04.000Z" }),
    ]);

    expect(out.keep[0].createdAt).toBe("2026-08-01T10:00:00.000Z");
  });

  it("leaves answered requests entirely alone", () => {
    const mixed = [
      request({ notified: true, createdAt: "2026-03-01T10:00:00.000Z" }),
      request({ notified: true, createdAt: "2026-04-01T10:00:00.000Z" }),
      request({ createdAt: "2026-08-01T10:00:00.000Z" }),
    ];

    const { keep, remove } = splitDuplicateAlerts(mixed);

    expect(remove).toHaveLength(0);
    expect(keep).toHaveLength(1);
    expect(keep[0].notified).toBe(false);
  });

  it("never merges two customers or two products", () => {
    const distinct = [
      request({ email: "a@gmail.com", productCode: "FS-001" }),
      request({ email: "b@gmail.com", productCode: "FS-001" }),
      request({ email: "a@gmail.com", productCode: "FS-002" }),
    ];

    const { keep, remove } = splitDuplicateAlerts(distinct);

    expect(keep).toHaveLength(3);
    expect(remove).toHaveLength(0);
  });

  // A dated request must win over an undated one, so a missing field cannot
  // cause the real record to be the one deleted.
  it("keeps a dated request over one with no date", () => {
    const out = splitDuplicateAlerts([
      request({ createdAt: undefined }),
      request({ createdAt: "2026-08-01T10:00:00.000Z" }),
    ]);

    expect(out.keep[0].createdAt).toBe("2026-08-01T10:00:00.000Z");
    expect(out.remove[0].createdAt).toBeUndefined();
  });

  it("ignores records with no email or no product", () => {
    const broken = [request({ email: "" }), request({ productCode: "" })];
    const { keep, remove } = splitDuplicateAlerts(broken);

    expect(keep).toHaveLength(0);
    expect(remove).toHaveLength(0);
  });

  it("survives an empty or missing list", () => {
    expect(splitDuplicateAlerts([]).remove).toHaveLength(0);
    expect(splitDuplicateAlerts(null).remove).toHaveLength(0);
  });
});
