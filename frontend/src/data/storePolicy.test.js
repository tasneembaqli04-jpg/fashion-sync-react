import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  FREE_SHIPPING_THRESHOLD,
  CANCEL_WINDOW_HOURS,
  RETURN_WINDOW_DAYS,
  POINT_REDEMPTION_VALUE,
  POINTS_PER_SHEKEL,
  withPolicyNumbers,
} from "./storePolicy";
import { getShippingCost } from "../functions/checkout/checkoutPricing";
import { canCancelOrder, canRequestReturn } from "../functions/customer/orderPolicy";
import { en } from "../translations/en";
import { he } from "../translations/he";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe("withPolicyNumbers", () => {
  it("fills every placeholder from the constants", () => {
    const filled = withPolicyNumbers(
      "free over {threshold}, cancel within {hours}h, return within {days}d, {points} points",
    );

    expect(filled).toBe(
      `free over ${FREE_SHIPPING_THRESHOLD}, cancel within ${CANCEL_WINDOW_HOURS}h, ` +
        `return within ${RETURN_WINDOW_DAYS}d, ${POINTS_PER_SHEKEL} points`,
    );
  });

  it("replaces every occurrence, not only the first", () => {
    expect(withPolicyNumbers("{hours} then {hours}")).toBe(
      `${CANCEL_WINDOW_HOURS} then ${CANCEL_WINDOW_HOURS}`,
    );
  });

  it("leaves text without placeholders untouched", () => {
    expect(withPolicyNumbers("nothing to fill")).toBe("nothing to fill");
  });

  it("survives a missing value", () => {
    expect(withPolicyNumbers(undefined)).toBe("");
    expect(withPolicyNumbers(null)).toBe("");
  });
});

// The point of the constants: the wording the customer reads and the rule the
// system enforces cannot drift apart, because both come from one value.
describe("the published wording matches the enforced rule", () => {
  it("states the same free-shipping threshold the pricing applies", () => {
    const line = withPolicyNumbers(en.customer.policy.shippingLine1);
    expect(line).toContain(String(FREE_SHIPPING_THRESHOLD));

    const standard = { id: "standard", price: 25 };
    expect(getShippingCost(standard, FREE_SHIPPING_THRESHOLD)).toBe(0);
    expect(getShippingCost(standard, FREE_SHIPPING_THRESHOLD - 1)).toBe(25);
  });

  it("states the same cancellation window the policy enforces", () => {
    for (const dict of [en, he]) {
      expect(withPolicyNumbers(dict.customer.policy.cancellationText)).toContain(
        String(CANCEL_WINDOW_HOURS),
      );
    }

    const placed = Date.now();
    const order = { status: 0, date: new Date(placed).toISOString() };

    expect(canCancelOrder(order, placed + (CANCEL_WINDOW_HOURS - 1) * HOUR)).toBe(true);
    expect(canCancelOrder(order, placed + (CANCEL_WINDOW_HOURS + 1) * HOUR)).toBe(false);
  });

  it("states the same return window the policy enforces", () => {
    for (const dict of [en, he]) {
      expect(withPolicyNumbers(dict.customer.policy.returnsText)).toContain(
        String(RETURN_WINDOW_DAYS),
      );
      expect(
        withPolicyNumbers(dict.customer.returns.returnWindowExpired),
      ).toContain(String(RETURN_WINDOW_DAYS));
    }

    const delivered = Date.now();
    const order = { status: 3, deliveredAt: new Date(delivered).toISOString() };

    expect(canRequestReturn(order, delivered + (RETURN_WINDOW_DAYS - 1) * DAY)).toBe(true);
    expect(canRequestReturn(order, delivered + (RETURN_WINDOW_DAYS + 1) * DAY)).toBe(false);
  });

  // Every string carrying a placeholder must be rendered through the filler.
  // This catches a new one being added to the dictionary without wiring.
  it("has a filler for every placeholder used anywhere in either dictionary", () => {
    const known = /\{(threshold|hours|days|points)\}/g;

    for (const dict of [en, he]) {
      const found = new Set();

      (function walk(node) {
        if (typeof node === "string") {
          for (const m of node.matchAll(known)) found.add(m[0]);
          return;
        }
        if (node && typeof node === "object") Object.values(node).forEach(walk);
      })(dict);

      for (const placeholder of found) {
        expect(withPolicyNumbers(placeholder)).not.toBe(placeholder);
      }
    }
  });

  it("fills the shipping option note the checkout shows", () => {
    for (const dict of [en, he]) {
      const note = dict.shippingOptionLabels.standard.note;
      expect(withPolicyNumbers(note)).toContain(String(FREE_SHIPPING_THRESHOLD));
      expect(withPolicyNumbers(note)).not.toContain("{threshold}");
    }
  });

  it("leaves no unfilled placeholder in either language", () => {
    for (const dict of [en, he]) {
      const texts = [
        dict.customer.policy.shippingLine1,
        dict.customer.policy.returnsText,
        dict.customer.policy.cancellationText,
        dict.customer.returns.returnWindowExpired,
      ];

      for (const text of texts) {
        expect(withPolicyNumbers(text)).not.toMatch(/\{(threshold|hours|days|points)\}/);
      }
    }
  });
});

describe("loyalty redemption", () => {
  // 20 points to the shekel: the rate and the wording derive from one value.
  it("keeps the points-per-shekel figure consistent with the rate", () => {
    expect(POINTS_PER_SHEKEL * POINT_REDEMPTION_VALUE).toBeCloseTo(1, 10);
    expect(POINTS_PER_SHEKEL).toBe(20);
  });

  it("converts points to shekels at the stated rate", () => {
    expect(100 * POINT_REDEMPTION_VALUE).toBeCloseTo(5, 10);
  });
});

describe("the point rate has one source", () => {
  // Two customer screens used to compute the redemption value from a literal
  // 0.05 while the checkout read POINT_REDEMPTION_VALUE. They agreed only by
  // coincidence: changing the rate here would have left both screens
  // promising an amount the checkout would not honour. The screens now read
  // the constant, and this holds them to it.
  const screens = [
    "src/components/customer/CustomerLoyalty.jsx",
    "src/components/customer/CartDrawer.jsx",
  ];

  it.each(screens)("%s reads the constant rather than a number", (file) => {
    const source = readFileSync(file, "utf8");

    expect(source).toContain("POINT_REDEMPTION_VALUE");
  });

  it.each(screens)("%s states no rate of its own", (file) => {
    const source = readFileSync(file, "utf8");

    // The rate written out as a number, in either spacing.
    expect(source.includes("* 0.05")).toBe(false);
    expect(source.includes("*0.05")).toBe(false);
  });
});
