import { describe, it, expect } from "vitest";
import { isCompletedTrade } from "./orderStatus";

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
