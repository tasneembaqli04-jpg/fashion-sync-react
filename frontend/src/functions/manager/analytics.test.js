import { describe, it, expect } from "vitest";
import {
  calculateMonthlyStats,
  isSameMonth,
  getOrderGoodsRevenue,
  getSlowProducts,
} from "./analytics";

// A fixed reference point, so the tests do not depend on the calendar.
const NOW = new Date("2026-08-15T12:00:00Z").getTime();
const inMonth = (day) => `2026-08-${String(day).padStart(2, "0")}T10:00:00.000Z`;
const lastMonth = "2026-07-20T10:00:00.000Z";

// Revenue is measured from the goods on the order, not from the total, so the
// helper carries a single item worth the whole order.
const order = (total, extra = {}) => ({
  total,
  date: inMonth(5),
  customerEmail: "a@b.c",
  subtotal: total,
  items: [{ code: "FS-001", price: total, qty: 1 }],
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

    // Counted as an order rather than misread as a gift card sale, but it
    // carries no goods, so there is nothing to recognise as revenue.
    expect(stats.salesCount).toBe(1);
    expect(stats.monthRevenue).toBe(0);
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

describe("getOrderGoodsRevenue — shipping is excluded", () => {
  const shirt = { code: "FS-001", price: 300, qty: 1 };

  it("leaves the delivery fee out of revenue", () => {
    const revenue = getOrderGoodsRevenue({
      items: [shirt],
      subtotal: 300,
      shippingCost: 25,
      total: 325,
    });

    expect(revenue).toBe(300);
  });

  it("gives the same revenue however the delivery was priced", () => {
    const base = { items: [shirt], subtotal: 300 };

    expect(getOrderGoodsRevenue({ ...base, shippingCost: 0, total: 300 })).toBe(300);
    expect(getOrderGoodsRevenue({ ...base, shippingCost: 59, total: 359 })).toBe(300);
  });

  it("subtracts a coupon discount", () => {
    expect(
      getOrderGoodsRevenue({
        items: [shirt],
        subtotal: 300,
        discountAmount: 45,
        shippingCost: 25,
        total: 280,
      })
    ).toBe(255);
  });

  it("subtracts redeemed loyalty points", () => {
    expect(
      getOrderGoodsRevenue({
        items: [shirt],
        subtotal: 300,
        pointsDiscountAmount: 7.15,
        total: 292.85,
      })
    ).toBe(292.85);
  });

  it("never returns a negative figure", () => {
    expect(
      getOrderGoodsRevenue({
        items: [shirt],
        subtotal: 300,
        discountAmount: 500,
        total: 0,
      })
    ).toBe(0);
  });
});

describe("getOrderGoodsRevenue — a gift card is a liability", () => {
  it("recognises nothing on a gift-card-only order", () => {
    expect(
      getOrderGoodsRevenue({
        items: [{ code: "GC-1", price: 200, qty: 1, isGiftCard: true }],
        subtotal: 200,
        total: 200,
      })
    ).toBe(0);
  });

  // The order document does not record how much of a card was redeemed. The
  // goods measure does not need it: the same goods left the shop either way.
  it("recognises the full goods value however the order was paid", () => {
    const paidInCash = getOrderGoodsRevenue({
      items: [{ code: "FS-001", price: 500, qty: 1 }],
      subtotal: 500,
      total: 500,
    });

    const paidPartlyByCard = getOrderGoodsRevenue({
      items: [{ code: "FS-001", price: 500, qty: 1 }],
      subtotal: 500,
      total: 300,
    });

    expect(paidInCash).toBe(500);
    expect(paidPartlyByCard).toBe(500);
  });

  it("excludes the card from a mixed order and keeps the goods", () => {
    expect(
      getOrderGoodsRevenue({
        items: [
          { code: "GC-1", price: 200, qty: 1, isGiftCard: true },
          { code: "FS-001", price: 300, qty: 1 },
        ],
        subtotal: 500,
        total: 500,
      })
    ).toBe(300);
  });

  it("apportions a discount to the goods share of a mixed order", () => {
    // 300 of 500 is goods, so 60% of the 50 discount lands on the goods.
    expect(
      getOrderGoodsRevenue({
        items: [
          { code: "GC-1", price: 200, qty: 1, isGiftCard: true },
          { code: "FS-001", price: 300, qty: 1 },
        ],
        subtotal: 500,
        discountAmount: 50,
        total: 450,
      })
    ).toBe(270);
  });
});

describe("the gift card cycle balances", () => {
  const NOW2 = new Date("2026-08-15T12:00:00Z").getTime();
  const day = "2026-08-05T10:00:00.000Z";

  // Buying a 200 card and later spending it on a 500 order must recognise
  // 500 in total, which is what the shop received.
  it("recognises the full goods value across the two orders", () => {
    const stats = calculateMonthlyStats({
      orders: [
        {
          total: 200,
          date: day,
          customerEmail: "a@b.c",
          subtotal: 200,
          items: [{ code: "GC-1", price: 200, qty: 1, isGiftCard: true }],
        },
        {
          total: 300,
          date: day,
          customerEmail: "a@b.c",
          subtotal: 500,
          items: [{ code: "FS-001", price: 500, qty: 1 }],
        },
      ],
      now: NOW2,
    });

    expect(stats.monthRevenue).toBe(500);
    expect(stats.salesCount).toBe(1);
  });

  it("books the delivery fee outside the margin", () => {
    const stats = calculateMonthlyStats({
      orders: [
        {
          total: 325,
          date: day,
          customerEmail: "a@b.c",
          subtotal: 300,
          shippingCost: 25,
          items: [{ code: "FS-001", price: 300, qty: 1 }],
        },
      ],
      products: [{ code: "FS-001", cost: 100, cat: "חולצות" }],
      now: NOW2,
    });

    expect(stats.monthRevenue).toBe(300);
    expect(stats.monthExpenses).toBe(100);
    expect(stats.monthProfit).toBe(200);
  });
});

describe("getSlowProducts", () => {
  const make = (code, salesLastMonth, stock, price) => ({
    code,
    salesLastMonth,
    stock,
    price,
  });

  it("keeps the list short on a catalogue where almost nothing sells", () => {
    // 114 products, 101 of them in stock with two sales or fewer.
    const catalogue = Array.from({ length: 114 }, (_, i) =>
      make(`FS-${String(i + 1).padStart(3, "0")}`, i < 101 ? 0 : 20, 5, 100)
    );

    const slow = getSlowProducts(catalogue);

    expect(slow.length).toBeLessThanOrEqual(15);
    expect(slow.length).toBeGreaterThanOrEqual(5);
  });

  it("puts the least sold first", () => {
    const slow = getSlowProducts([
      make("A", 9, 5, 100),
      make("B", 0, 5, 100),
      make("C", 4, 5, 100),
    ]);

    expect(slow.map((p) => p.code)).toEqual(["B", "C", "A"]);
  });

  it("breaks a tie on the capital sitting on the shelf", () => {
    const slow = getSlowProducts([
      make("CHEAP", 0, 2, 30),
      make("PRICEY", 0, 40, 300),
      make("MIDDLE", 0, 10, 100),
    ]);

    expect(slow.map((p) => p.code)).toEqual(["PRICEY", "MIDDLE", "CHEAP"]);
  });

  it("never lists a product that is out of stock", () => {
    const slow = getSlowProducts([
      make("SOLD_OUT", 0, 0, 500),
      make("IN_STOCK", 3, 5, 100),
    ]);

    expect(slow.map((p) => p.code)).toEqual(["IN_STOCK"]);
  });

  it("returns an empty list when nothing is in stock", () => {
    expect(getSlowProducts([make("A", 0, 0, 100)])).toEqual([]);
    expect(getSlowProducts([])).toEqual([]);
  });

  it("shows the whole in-stock catalogue when it is smaller than the floor", () => {
    const slow = getSlowProducts([make("A", 0, 1, 10), make("B", 1, 1, 10)]);
    expect(slow).toHaveLength(2);
  });

  it("scales with the catalogue rather than a fixed count", () => {
    const catalogue = Array.from({ length: 200 }, (_, i) =>
      make(`P${i}`, i, 5, 100)
    );

    expect(getSlowProducts(catalogue, { share: 0.1, min: 5, max: 100 }))
      .toHaveLength(20);
  });

  it("orders deterministically when sales and value both tie", () => {
    const first = getSlowProducts([make("B", 0, 5, 100), make("A", 0, 5, 100)]);
    const second = getSlowProducts([make("A", 0, 5, 100), make("B", 0, 5, 100)]);

    expect(first.map((p) => p.code)).toEqual(second.map((p) => p.code));
  });
});
