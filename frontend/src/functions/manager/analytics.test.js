import { describe, it, expect } from "vitest";
import { calculateMonthlyStats, isSameMonth } from "./analytics";

// A fixed reference point, so the tests do not depend on the calendar.
const NOW = new Date("2026-08-15T12:00:00Z").getTime();
const inMonth = (day) => `2026-08-${String(day).padStart(2, "0")}T10:00:00.000Z`;
const lastMonth = "2026-07-20T10:00:00.000Z";

const order = (total, extra = {}) => ({
  total,
  date: inMonth(5),
  customerEmail: "a@b.c",
  items: [],
  ...extra,
});

describe("isSameMonth", () => {
  it("accepts a date in the reference month", () => {
    expect(isSameMonth(inMonth(1), NOW)).toBe(true);
    expect(isSameMonth(inMonth(28), NOW)).toBe(true);
  });

  it("rejects a date from another month", () => {
    expect(isSameMonth(lastMonth, NOW)).toBe(false);
    expect(isSameMonth("2025-08-15T10:00:00.000Z", NOW)).toBe(false);
  });

  it("rejects a missing or unparseable date", () => {
    expect(isSameMonth(undefined, NOW)).toBe(false);
    expect(isSameMonth(null, NOW)).toBe(false);
    expect(isSameMonth("not a date", NOW)).toBe(false);
  });
});

describe("avgOrder reconciles with the displayed revenue", () => {
  // The figure the screen labels "revenue" is net of approved returns.
  // Averaging the gross revenue put two numbers on screen that could not both
  // be true: 3 orders totalling 1000 with 200 returned showed revenue 800 and
  // an average of 333, and 333 × 3 is 999.
  it("averages the net revenue, not the gross", () => {
    const stats = calculateMonthlyStats({
      orders: [order(300), order(500), order(200)],
      returnRequests: [
        { status: "approved", createdAt: inMonth(9), price: 200, qty: 1 },
      ],
      now: NOW,
    });

    expect(stats.monthRevenue).toBe(800);
    expect(stats.salesCount).toBe(3);
    expect(stats.avgOrder).toBe(267);
    expect(stats.avgOrder * stats.salesCount).toBe(801);
    expect(Math.abs(stats.avgOrder * stats.salesCount - stats.monthRevenue))
      .toBeLessThanOrEqual(stats.salesCount / 2);
  });

  it("matches exactly when the net revenue divides evenly", () => {
    const stats = calculateMonthlyStats({
      orders: [order(300), order(500), order(200)],
      returnRequests: [
        { status: "approved", createdAt: inMonth(9), price: 100, qty: 1 },
      ],
      now: NOW,
    });

    expect(stats.monthRevenue).toBe(900);
    expect(stats.avgOrder).toBe(300);
    expect(stats.avgOrder * stats.salesCount).toBe(900);
  });

  it("equals the gross average when there are no returns", () => {
    const stats = calculateMonthlyStats({
      orders: [order(300), order(500), order(200)],
      now: NOW,
    });

    expect(stats.monthRevenue).toBe(1000);
    expect(stats.avgOrder).toBe(333);
  });

  it("is 0 rather than NaN when there are no orders", () => {
    const stats = calculateMonthlyStats({ orders: [], now: NOW });

    expect(stats.avgOrder).toBe(0);
    expect(Number.isNaN(stats.avgOrder)).toBe(false);
    expect(stats.salesCount).toBe(0);
    expect(stats.monthRevenue).toBe(0);
  });

  it("ignores orders from other months", () => {
    const stats = calculateMonthlyStats({
      orders: [order(300), order(700, { date: lastMonth })],
      now: NOW,
    });

    expect(stats.salesCount).toBe(1);
    expect(stats.monthRevenue).toBe(300);
  });
});

describe("missingCostCount counts absence, not a cost of zero", () => {
  const items = [{ code: "FS-001", qty: 2, price: 100 }];

  it("does not flag a genuine cost of 0", () => {
    const stats = calculateMonthlyStats({
      orders: [order(200, { items })],
      products: [{ code: "FS-001", cost: 0, cat: "חולצות" }],
      now: NOW,
    });

    expect(stats.missingCostCount).toBe(0);
    expect(stats.monthExpenses).toBe(0);
  });

  it("flags an undefined cost", () => {
    const stats = calculateMonthlyStats({
      orders: [order(200, { items })],
      products: [{ code: "FS-001", cat: "חולצות" }],
      now: NOW,
    });

    expect(stats.missingCostCount).toBe(1);
  });

  it("flags a null cost", () => {
    const stats = calculateMonthlyStats({
      orders: [order(200, { items })],
      products: [{ code: "FS-001", cost: null, cat: "חולצות" }],
      now: NOW,
    });

    expect(stats.missingCostCount).toBe(1);
  });

  it("flags a product that is not in the catalogue at all", () => {
    const stats = calculateMonthlyStats({
      orders: [order(200, { items })],
      products: [],
      now: NOW,
    });

    expect(stats.missingCostCount).toBe(1);
  });

  it("does not flag an ordinary positive cost", () => {
    const stats = calculateMonthlyStats({
      orders: [order(200, { items })],
      products: [{ code: "FS-001", cost: 40, cat: "חולצות" }],
      now: NOW,
    });

    expect(stats.missingCostCount).toBe(0);
    expect(stats.monthExpenses).toBe(80);
  });
});

describe("profit and the remaining ratios", () => {
  it("computes profit as net revenue minus net expenses", () => {
    const stats = calculateMonthlyStats({
      orders: [order(500, { items: [{ code: "FS-001", qty: 2, price: 250 }] })],
      products: [{ code: "FS-001", cost: 100, cat: "חולצות" }],
      now: NOW,
    });

    expect(stats.monthRevenue).toBe(500);
    expect(stats.monthExpenses).toBe(200);
    expect(stats.monthProfit).toBe(300);
  });

  it("recovers the unit cost of a returned item unless it was defective", () => {
    const base = {
      orders: [order(500, { items: [{ code: "FS-001", qty: 2, price: 250 }] })],
      products: [{ code: "FS-001", cost: 100, cat: "חולצות" }],
      now: NOW,
    };

    const returned = calculateMonthlyStats({
      ...base,
      returnRequests: [
        {
          status: "approved",
          createdAt: inMonth(9),
          price: 250,
          qty: 1,
          itemCode: "FS-001",
          reasonKey: "wrongSize",
        },
      ],
    });

    expect(returned.monthRevenue).toBe(250);
    expect(returned.monthExpenses).toBe(100);
    expect(returned.monthProfit).toBe(150);

    const defective = calculateMonthlyStats({
      ...base,
      returnRequests: [
        {
          status: "approved",
          createdAt: inMonth(9),
          price: 250,
          qty: 1,
          itemCode: "FS-001",
          reasonKey: "defective",
        },
      ],
    });

    expect(defective.monthExpenses).toBe(200);
  });

  it("ignores a return that is not approved", () => {
    const stats = calculateMonthlyStats({
      orders: [order(500)],
      returnRequests: [
        { status: "pending", createdAt: inMonth(9), price: 200, qty: 1 },
      ],
      now: NOW,
    });

    expect(stats.monthRevenue).toBe(500);
    expect(stats.returnsCount).toBe(0);
  });

  it("is 0 rather than NaN for repeatPct when there are no customers", () => {
    const stats = calculateMonthlyStats({ orders: [], now: NOW });

    expect(stats.repeatPct).toBe(0);
    expect(Number.isNaN(stats.repeatPct)).toBe(false);
  });

  it("computes repeatPct from every order, not only this month's", () => {
    const stats = calculateMonthlyStats({
      orders: [
        order(100, { customerEmail: "a@b.c" }),
        order(100, { customerEmail: "a@b.c", date: lastMonth }),
        order(100, { customerEmail: "d@e.f" }),
      ],
      now: NOW,
    });

    expect(stats.repeatPct).toBe(50);
  });

  it("keeps maxCategorySale at 1 rather than -Infinity when empty", () => {
    const stats = calculateMonthlyStats({ orders: [], now: NOW });

    expect(stats.maxCategorySale).toBe(1);
    expect(Number.isFinite(stats.maxCategorySale)).toBe(true);
  });

  it("excludes gift-card-only orders from every figure", () => {
    const stats = calculateMonthlyStats({
      orders: [
        order(200, { items: [{ code: "GC-1", qty: 1, isGiftCard: true }] }),
        order(300, { items: [{ code: "FS-001", qty: 1, price: 300 }] }),
      ],
      products: [{ code: "FS-001", cost: 100, cat: "חולצות" }],
      now: NOW,
    });

    expect(stats.salesCount).toBe(1);
    expect(stats.monthRevenue).toBe(300);
  });
});

describe("orders with an empty items array", () => {
  // [].every(...) is true, so an empty items array reads as "every item is a
  // gift card" and the order would drop out of every figure on the screen.
  it("counts an order whose items array is empty", () => {
    const stats = calculateMonthlyStats({
      orders: [order(250, { items: [] })],
      now: NOW,
    });

    expect(stats.salesCount).toBe(1);
    expect(stats.monthRevenue).toBe(250);
  });

  it("still counts an order with no items field at all", () => {
    const stats = calculateMonthlyStats({
      orders: [{ total: 250, date: inMonth(5), customerEmail: "a@b.c" }],
      now: NOW,
    });

    expect(stats.salesCount).toBe(1);
  });

  it("still excludes a genuine gift-card-only order", () => {
    const stats = calculateMonthlyStats({
      orders: [order(250, { items: [{ code: "GC-1", isGiftCard: true }] })],
      now: NOW,
    });

    expect(stats.salesCount).toBe(0);
  });
});
