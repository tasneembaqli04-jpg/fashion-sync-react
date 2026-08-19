import { describe, it, expect } from "vitest";
import { calculateMonthlyStats } from "./analytics";

// The overview card and the analytics screen both read from this one
// calculation, given the same orders, products and return requests. The
// figures they print therefore cannot drift apart — which is what these
// assertions hold in place.
const NOW = new Date("2026-08-15T12:00:00Z").getTime();
const inMonth = (d) => `2026-08-${String(d).padStart(2, "0")}T10:00:00.000Z`;

const order = (total, extra = {}) => ({
  total,
  date: inMonth(5),
  customerEmail: "a@b.c",
  subtotal: total,
  items: [{ code: "FS-001", price: total, qty: 1 }],
  ...extra,
});

const input = {
  orders: [
    order(300),
    order(500),
    order(200, { cancelled: true }),
    order(900, { rejected: true }),
  ],
  products: [{ code: "FS-001", cost: 50, cat: "dresses" }],
  returnRequests: [
    { status: "approved", createdAt: inMonth(9), price: 100, qty: 1 },
  ],
  now: NOW,
};

describe("the overview card and the analytics screen show one number", () => {
  it("both read monthRevenue, which is already net of returns", () => {
    const stats = calculateMonthlyStats(input);

    // 300 + 500 of goods, less the 100 returned. The cancelled and rejected
    // orders contribute nothing to either screen.
    expect(stats.monthRevenue).toBe(700);
    expect(stats.salesCount).toBe(2);
  });

  it("exposes no separate adjustedRevenue for a caller to reach for", () => {
    // The overview card asked for `adjustedRevenue` and got undefined, which
    // would have printed as a crash rather than a number.
    const stats = calculateMonthlyStats(input);

    expect(stats.adjustedRevenue).toBeUndefined();
    expect(typeof stats.monthRevenue).toBe("number");
    expect(Number.isFinite(stats.monthRevenue)).toBe(true);
  });

  it("keeps the transaction count and the revenue consistent with each other", () => {
    const stats = calculateMonthlyStats(input);

    expect(stats.salesCount).toBe(2);
    expect(Math.abs(stats.avgOrder * stats.salesCount - stats.monthRevenue))
      .toBeLessThanOrEqual(stats.salesCount * 0.05);
  });
});
