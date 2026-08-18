import { describe, it, expect } from "vitest";
import {
  DEFAULT_INITIAL,
  DEFAULT_STEP,
  hasMore,
  nextCount,
  remainingCount,
  visibleSlice,
} from "./progressiveList";

const items = Array.from({ length: 12 }, (_, i) => `item-${i + 1}`);

describe("visibleSlice", () => {
  it("returns the leading records", () => {
    expect(visibleSlice(items, 5)).toEqual([
      "item-1",
      "item-2",
      "item-3",
      "item-4",
      "item-5",
    ]);
  });

  it("returns everything when the count exceeds the list", () => {
    expect(visibleSlice(items, 999)).toHaveLength(12);
  });

  it("returns nothing for a count of zero", () => {
    expect(visibleSlice(items, 0)).toEqual([]);
  });

  it("survives a missing list", () => {
    expect(visibleSlice(undefined, 5)).toEqual([]);
    expect(visibleSlice(null, 5)).toEqual([]);
  });

  it("treats a negative count as zero", () => {
    expect(visibleSlice(items, -3)).toEqual([]);
  });
});

describe("remainingCount", () => {
  it("counts what is still hidden", () => {
    expect(remainingCount(items, 5)).toBe(7);
  });

  it("is zero once everything is shown", () => {
    expect(remainingCount(items, 12)).toBe(0);
  });

  it("never goes negative when the count overruns the list", () => {
    expect(remainingCount(items, 40)).toBe(0);
  });

  it("counts the whole list when nothing is shown", () => {
    expect(remainingCount(items, 0)).toBe(12);
  });

  it("survives a missing list", () => {
    expect(remainingCount(undefined, 5)).toBe(0);
  });
});

describe("hasMore", () => {
  it("is true while records are hidden", () => {
    expect(hasMore(items, 5)).toBe(true);
  });

  it("is false once the list is exhausted", () => {
    expect(hasMore(items, 12)).toBe(false);
    expect(hasMore(items, 99)).toBe(false);
  });

  it("is false for an empty list", () => {
    expect(hasMore([], 5)).toBe(false);
  });
});

describe("nextCount", () => {
  it("adds one step", () => {
    expect(nextCount(5, 5, 12)).toBe(10);
  });

  it("stops at the end of the list rather than overshooting", () => {
    expect(nextCount(10, 5, 12)).toBe(12);
  });

  it("cannot exceed the total, so the button cannot promise nothing", () => {
    expect(nextCount(12, 5, 12)).toBe(12);
    expect(remainingCount(items, nextCount(10, 5, 12))).toBe(0);
  });

  it("falls back to the default step when given a useless one", () => {
    expect(nextCount(0, 0, 100)).toBe(DEFAULT_STEP);
    expect(nextCount(0, undefined, 100)).toBe(DEFAULT_STEP);
  });

  it("handles an empty list", () => {
    expect(nextCount(0, 5, 0)).toBe(0);
  });
});

describe("the defaults", () => {
  it("start and step by the same amount, so the list grows evenly", () => {
    expect(DEFAULT_INITIAL).toBe(DEFAULT_STEP);
  });
});
