import { describe, it, expect } from "vitest";
import {
  needsManagerDecision,
  isAwaitingDelivery,
  countOrdersNeedingDecision,
  countOrdersAwaitingDelivery,
} from "./orderStatus";

function order(overrides = {}) {
  return {
    confirmed: false,
    cancelled: false,
    rejected: false,
    stageIndex: 0,
    ...overrides,
  };
}

describe("needsManagerDecision", () => {
  it("counts a brand new order", () => {
    expect(needsManagerDecision(order())).toBe(true);
  });

  it("stops counting once the order is accepted", () => {
    expect(needsManagerDecision(order({ confirmed: true }))).toBe(false);
  });

  it("stops counting once the customer cancels", () => {
    expect(needsManagerDecision(order({ cancelled: true }))).toBe(false);
  });

  // The defect this module exists to prevent: rejecting an order sets only
  // `rejected`, leaving `confirmed` and `cancelled` false. A count that asks
  // only about those two keeps the order forever.
  it("stops counting once the manager rejects", () => {
    expect(needsManagerDecision(order({ rejected: true }))).toBe(false);
  });

  it("treats a missing order as needing nothing", () => {
    expect(needsManagerDecision(null)).toBe(false);
    expect(needsManagerDecision(undefined)).toBe(false);
  });
});

describe("isAwaitingDelivery", () => {
  it("counts an accepted order that has not shipped yet", () => {
    expect(isAwaitingDelivery(order({ confirmed: true, stageIndex: 0 }))).toBe(true);
  });

  it("counts an accepted order in transit", () => {
    expect(isAwaitingDelivery(order({ confirmed: true, stageIndex: 2 }))).toBe(true);
  });

  it("stops counting at the delivered stage", () => {
    expect(isAwaitingDelivery(order({ confirmed: true, stageIndex: 3 }))).toBe(false);
  });

  it("does not count an order the manager has not accepted", () => {
    expect(isAwaitingDelivery(order({ stageIndex: 1 }))).toBe(false);
  });

  it("does not count an order the customer cancelled after acceptance", () => {
    expect(
      isAwaitingDelivery(order({ confirmed: true, cancelled: true, stageIndex: 1 })),
    ).toBe(false);
  });

  it("does not count an order marked both accepted and rejected", () => {
    expect(
      isAwaitingDelivery(order({ confirmed: true, rejected: true, stageIndex: 1 })),
    ).toBe(false);
  });

  it("treats a missing stage as stage 0", () => {
    const noStage = { confirmed: true, cancelled: false, rejected: false };
    expect(isAwaitingDelivery(noStage)).toBe(true);
  });
});

describe("counts over a mixed list", () => {
  // Ten orders: 3 waiting, 2 accepted and in transit, 1 delivered,
  // 2 rejected, 2 cancelled.
  const orders = [
    order(),
    order(),
    order(),
    order({ confirmed: true, stageIndex: 1 }),
    order({ confirmed: true, stageIndex: 2 }),
    order({ confirmed: true, stageIndex: 3 }),
    order({ rejected: true }),
    order({ rejected: true }),
    order({ cancelled: true }),
    order({ confirmed: true, cancelled: true, stageIndex: 1 }),
  ];

  it("counts only the three still waiting on a decision", () => {
    expect(countOrdersNeedingDecision(orders)).toBe(3);
  });

  it("counts only the two accepted and undelivered", () => {
    expect(countOrdersAwaitingDelivery(orders)).toBe(2);
  });

  // Before the fix, the two rejected orders were counted as pending, giving 5
  // instead of 3 and a badge that never reached zero.
  it("excludes rejected orders that the old rule kept counting", () => {
    const oldRule = orders.filter((o) => !o.confirmed && !o.cancelled).length;
    expect(oldRule).toBe(5);
    expect(countOrdersNeedingDecision(orders)).toBe(3);
  });

  it("returns zero once every order is decided", () => {
    const decided = [
      order({ confirmed: true, stageIndex: 3 }),
      order({ rejected: true }),
      order({ cancelled: true }),
    ];
    expect(countOrdersNeedingDecision(decided)).toBe(0);
  });

  it("treats a missing list as empty", () => {
    expect(countOrdersNeedingDecision(null)).toBe(0);
    expect(countOrdersAwaitingDelivery(undefined)).toBe(0);
  });
});
