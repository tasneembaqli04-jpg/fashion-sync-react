import { describe, it, expect } from "vitest";
import { countByOutcome, isCompletedTrade } from "./orderStatus";

describe("isCompletedTrade", () => {
  it("counts an order that is on its way", () => {
    expect(isCompletedTrade({ confirmed: true })).toBe(true);
  });

  it("counts an order still waiting for a decision", () => {
    // The stock leaves the shelf at checkout, not on approval.
    expect(isCompletedTrade({ confirmed: false })).toBe(true);
  });

  it("does not count a cancelled order", () => {
    expect(isCompletedTrade({ cancelled: true })).toBe(false);
  });

  it("does not count a rejected order", () => {
    expect(isCompletedTrade({ rejected: true })).toBe(false);
  });

  it("does not count an order that is both", () => {
    expect(isCompletedTrade({ cancelled: true, rejected: true })).toBe(false);
  });

  it("survives a missing order", () => {
    expect(isCompletedTrade(null)).toBe(false);
    expect(isCompletedTrade(undefined)).toBe(false);
  });
});

describe("countByOutcome", () => {
  const orders = [
    {},                                    // pending
    {},                                    // pending
    { confirmed: true },                   // confirmed
    { cancelled: true },                   // cancelled
    { rejected: true },                    // rejected
    { cancelled: true, rejected: true },   // both — counted once
  ];

  it("puts every order in exactly one bucket", () => {
    const counts = countByOutcome(orders);

    expect(counts).toEqual({
      pending: 2,
      confirmed: 1,
      cancelled: 2,
      rejected: 1,
    });
  });

  it("always sums to the number of orders given", () => {
    const counts = countByOutcome(orders);
    const total = counts.pending + counts.confirmed + counts.cancelled + counts.rejected;

    // This is the assertion the screen needs: the four cards add up to the
    // total card beside them. Counting each flag separately gave 7 here.
    expect(total).toBe(orders.length);
  });

  it("counts an order carrying both flags as cancelled, not rejected", () => {
    // The customer acted first and is shown "cancelled". The manager's screen
    // says the same rather than contradicting her copy of the order.
    const counts = countByOutcome([{ cancelled: true, rejected: true }]);

    expect(counts.cancelled).toBe(1);
    expect(counts.rejected).toBe(0);
  });

  it("counts a confirmed order that was later cancelled as cancelled", () => {
    const counts = countByOutcome([{ confirmed: true, cancelled: true }]);

    expect(counts.cancelled).toBe(1);
    expect(counts.confirmed).toBe(0);
  });

  it("survives an empty or missing list", () => {
    expect(countByOutcome([])).toEqual({
      pending: 0, confirmed: 0, cancelled: 0, rejected: 0,
    });
    expect(countByOutcome()).toEqual({
      pending: 0, confirmed: 0, cancelled: 0, rejected: 0,
    });
  });

  it("skips a hole in the list rather than counting it as pending", () => {
    expect(countByOutcome([null, undefined, {}]).pending).toBe(1);
  });
});
