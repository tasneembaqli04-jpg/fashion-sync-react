import { describe, it, expect } from "vitest";
import { roundMoney, splitInstallments } from "./money";

describe("roundMoney", () => {
  // The exact values a cart of 249.90 + 2 × 89.90 and a redemption of
  // 143 loyalty points produce before rounding.
  it("clears the binary residue from a cart subtotal", () => {
    expect(roundMoney(429.70000000000005)).toBe(429.7);
  });

  it("clears the binary residue from an order total", () => {
    expect(roundMoney(386.70000000000005)).toBe(386.7);
  });

  it("clears the residue from a points discount", () => {
    expect(roundMoney(3 * 0.05)).toBe(0.15);
    expect(roundMoney(61 * 0.05)).toBe(3.05);
  });

  it("clears the residue from a gift card remainder", () => {
    expect(roundMoney(200 - 99.94999999999999)).toBe(100.05);
  });

  it("rounds a genuine half-way tie upward", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(2.675)).toBe(2.68);
  });

  it("keeps an amount that is already exact", () => {
    expect(roundMoney(158.55)).toBe(158.55);
    expect(roundMoney(25)).toBe(25);
    expect(roundMoney(0)).toBe(0);
  });

  it("parses a numeric string", () => {
    expect(roundMoney("12.345")).toBe(12.35);
  });

  it("returns 0 for anything that is not a finite number", () => {
    expect(roundMoney(NaN)).toBe(0);
    expect(roundMoney(undefined)).toBe(0);
    expect(roundMoney(null)).toBe(0);
    expect(roundMoney("abc")).toBe(0);
    expect(roundMoney(Infinity)).toBe(0);
  });

  it("makes a spent gift card compare equal to zero", () => {
    const balance = 100.1;
    const spent = roundMoney(balance - roundMoney(balance));
    expect(spent).toBe(0);
    expect(spent <= 0).toBe(true);
  });
});

describe("splitInstallments", () => {
  const sums = (total, count) => {
    const plan = splitInstallments(total, count);
    return roundMoney(plan.regular * (count - 1) + plan.last);
  };

  it("adds back up to exactly the total: 1000 over 12", () => {
    const plan = splitInstallments(1000, 12);
    expect(plan.regular).toBe(83.33);
    expect(plan.last).toBe(83.37);
    expect(sums(1000, 12)).toBe(1000);
  });

  it("adds back up to exactly the total: 1000 over 3", () => {
    const plan = splitInstallments(1000, 3);
    expect(plan.regular).toBe(333.33);
    expect(plan.last).toBe(333.34);
    expect(sums(1000, 3)).toBe(1000);
  });

  it("adds back up to exactly the total: 999 over 6", () => {
    const plan = splitInstallments(999, 6);
    expect(plan.regular).toBe(166.5);
    expect(plan.last).toBe(166.5);
    expect(plan.isUniform).toBe(true);
    expect(sums(999, 6)).toBe(999);
  });

  it("adds back up to exactly the total: 386.70 over 2", () => {
    const plan = splitInstallments(386.70000000000005, 2);
    expect(plan.regular).toBe(193.35);
    expect(plan.last).toBe(193.35);
    expect(sums(386.70000000000005, 2)).toBe(386.7);
  });

  it("never quotes a repeated instalment above the true share", () => {
    // The previous Math.ceil produced 84, which billed 1008 for a 1000 order.
    const plan = splitInstallments(1000, 12);
    expect(plan.regular).toBeLessThan(1000 / 12 + 0.01);
  });

  it("marks a plan that divides evenly as uniform", () => {
    const plan = splitInstallments(1200, 12);
    expect(plan.regular).toBe(100);
    expect(plan.last).toBe(100);
    expect(plan.isUniform).toBe(true);
  });

  it("marks a plan with a remainder as not uniform", () => {
    expect(splitInstallments(1000, 12).isUniform).toBe(false);
    expect(splitInstallments(1000, 3).isUniform).toBe(false);
  });

  it("treats a single instalment as the whole amount", () => {
    const plan = splitInstallments(386.70000000000005, 1);
    expect(plan.regular).toBe(386.7);
    expect(plan.last).toBe(386.7);
    expect(plan.isUniform).toBe(true);
  });

  it("balances across every offered instalment count", () => {
    for (const total of [1000, 999, 386.7, 158.55, 1200, 507.33]) {
      for (const count of [2, 3, 6, 12]) {
        expect(sums(total, count)).toBe(roundMoney(total));
      }
    }
  });

  it("falls back to a single instalment for a nonsensical count", () => {
    expect(splitInstallments(500, 0).regular).toBe(500);
    expect(splitInstallments(500, -3).regular).toBe(500);
  });
});
