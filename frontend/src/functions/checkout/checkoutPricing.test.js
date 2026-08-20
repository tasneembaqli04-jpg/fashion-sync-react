import { describe, it, expect } from "vitest";
import {
  getSubtotal,
  getDiscountAmount,
  getShippingCost,
  getTotal,
  usablePoints,
} from "./checkoutPricing";
import { POINT_REDEMPTION_VALUE } from "../../data/storePolicy";

describe("getSubtotal", () => {
  it("returns 0 for an empty cart", () => {
    expect(getSubtotal([])).toBe(0);
  });

  it("returns 0 when no cart is provided", () => {
    expect(getSubtotal()).toBe(0);
  });

  it("sums price * qty across all items", () => {
    const cart = [
      { price: 100, qty: 2 },
      { price: 50, qty: 1 },
    ];
    expect(getSubtotal(cart)).toBe(250);
  });

  it("treats missing price/qty as 0", () => {
    const cart = [{ price: 100 }, { qty: 3 }];
    expect(getSubtotal(cart)).toBe(0);
  });
});

describe("getDiscountAmount", () => {
  it("returns 0 when discountPct is 0", () => {
    expect(getDiscountAmount(500, 0)).toBe(0);
  });

  it("calculates a percentage discount correctly", () => {
    expect(getDiscountAmount(500, 10)).toBe(50);
  });

  it("rounds to the nearest whole number", () => {
    expect(getDiscountAmount(333, 10)).toBe(33);
  });

  it("returns 0 for a 0 subtotal regardless of discount", () => {
    expect(getDiscountAmount(0, 50)).toBe(0);
  });
});

describe("getShippingCost", () => {
  it("returns 0 when no shipping method is selected", () => {
    expect(getShippingCost(null, 100)).toBe(0);
  });

  it("charges the standard shipping price under the free-shipping threshold (₪200)", () => {
    const standard = { id: "standard", price: 25 };
    expect(getShippingCost(standard, 150)).toBe(25);
  });

  it("gives free standard shipping at exactly the ₪200 threshold", () => {
    const standard = { id: "standard", price: 25 };
    expect(getShippingCost(standard, 200)).toBe(0);
  });

  it("gives free standard shipping above the ₪200 threshold", () => {
    const standard = { id: "standard", price: 25 };
    expect(getShippingCost(standard, 350)).toBe(0);
  });

  it("does NOT give a free-shipping discount to express shipping, even above ₪200", () => {
    const express = { id: "express", price: 29 };
    expect(getShippingCost(express, 350)).toBe(29);
  });

  it("does NOT give a free-shipping discount to same-day shipping", () => {
    const sameDay = { id: "same_day", price: 59 };
    expect(getShippingCost(sameDay, 500)).toBe(59);
  });

  it("pickup always costs 0 regardless of subtotal", () => {
    const pickup = { id: "pickup", price: 0 };
    expect(getShippingCost(pickup, 10)).toBe(0);
  });
});

describe("getTotal", () => {
  const standard = { id: "standard", price: 25 };

  it("calculates a simple total with no discounts and paid shipping", () => {
    const cart = [{ price: 100, qty: 1 }];
    // subtotal 100, no discount, shipping 25 (under free threshold)
    expect(getTotal(cart, 0, standard, 0)).toBe(125);
  });

  it("applies a percentage discount before adding shipping", () => {
    const cart = [{ price: 100, qty: 1 }];
    // subtotal 100, 10% discount = 10, shipping 25 => 100 - 10 + 25 = 115
    expect(getTotal(cart, 10, standard, 0)).toBe(115);
  });

  it("applies loyalty points discount on top of a percentage discount", () => {
    const cart = [{ price: 300, qty: 1 }];
    // subtotal 300 (free shipping), 10% discount = 30, points discount 20
    // 300 - 30 - 20 + 0 = 250
    expect(getTotal(cart, 10, standard, 20)).toBe(250);
  });

  it("never goes below 0 even with discounts larger than the subtotal", () => {
    const cart = [{ price: 50, qty: 1 }];
    // subtotal 50, points discount 1000 (way more than subtotal)
    // afterDiscounts is clamped to 0, then shipping (25, since under 200) is still added
    expect(getTotal(cart, 0, standard, 1000)).toBe(25);
  });

  it("returns 0 for an empty cart with no shipping selected", () => {
    expect(getTotal([], 0, null, 0)).toBe(0);
  });
});
describe("usablePoints — the redemption is checked against the cart being paid for", () => {
  // 20 points to the shekel: 0.05 each.

  it("leaves an ordinary redemption untouched", () => {
    // 200 points against a cart of 300. The cart absorbs it easily, so the
    // customer spends exactly what she chose.
    expect(usablePoints(200, 300)).toBe(200);
  });

  it("leaves a redemption that exactly covers the cart untouched", () => {
    // 6,000 points is worth 300, and the cart is 300.
    expect(usablePoints(6000, 300)).toBe(6000);
  });

  it("spends only what the cart can absorb once an item is removed", () => {
    // She applied 6,000 points against a cart of 300, then removed an item
    // and the cart is 100. Only 2,000 points are worth spending; the rest
    // stay in her account instead of vanishing against a total of zero.
    expect(usablePoints(6000, 100)).toBe(2000);
  });

  it("spends nothing when the cart is empty", () => {
    expect(usablePoints(6000, 0)).toBe(0);
  });

  it("spends nothing when nothing was set aside", () => {
    expect(usablePoints(0, 300)).toBe(0);
  });

  it("never returns more than was asked for", () => {
    // A large cart does not spend points the customer did not offer.
    expect(usablePoints(100, 10000)).toBe(100);
  });

  it("never returns a fraction of a point", () => {
    // 90 buys 1,800 points exactly; 95 would buy 1,900.
    expect(Number.isInteger(usablePoints(9999, 95))).toBe(true);
    expect(usablePoints(9999, 95)).toBe(1900);
  });

  it("rounds down rather than granting a point that is not covered", () => {
    // 0.07 covers one point at 0.05, not two.
    expect(usablePoints(10, 0.07)).toBe(1);
  });

  it("survives missing or negative values", () => {
    expect(usablePoints()).toBe(0);
    expect(usablePoints(-50, 300)).toBe(0);
    expect(usablePoints(200, -10)).toBe(0);
    expect(usablePoints(null, null)).toBe(0);
  });

  it("matches the discount the checkout will actually apply", () => {
    // The property that matters: the points spent are never worth more than
    // the value they are reducing, so the total cannot clamp at zero with
    // points left unspent.
    for (const [asked, payable] of [[6000, 100], [200, 300], [1, 0.05], [40, 1]]) {
      const spent = usablePoints(asked, payable);
      expect(spent * POINT_REDEMPTION_VALUE).toBeLessThanOrEqual(payable + 1e-9);
    }
  });
});
