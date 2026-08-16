import { describe, it, expect } from "vitest";
import {
  ALL_MONTHS,
  UNKNOWN_MONTH,
  getMonthKey,
  getYearPart,
  getMonthPart,
  matchesMonthFilter,
  availableYears,
} from "./monthFilter";

describe("getMonthKey", () => {
  it("pads the month so keys sort as text", () => {
    expect(getMonthKey("2026-03-09T10:00:00.000Z")).toBe("2026-03");
    expect(getMonthKey("2026-11-09T10:00:00.000Z")).toBe("2026-11");
  });

  it("reports a date it cannot read rather than guessing", () => {
    expect(getMonthKey("")).toBe(UNKNOWN_MONTH);
    expect(getMonthKey(null)).toBe(UNKNOWN_MONTH);
    expect(getMonthKey("not a date")).toBe(UNKNOWN_MONTH);
  });
});

describe("getYearPart and getMonthPart", () => {
  it("splits a month key", () => {
    expect(getYearPart("2026-08")).toBe("2026");
    expect(getMonthPart("2026-08")).toBe("08");
  });

  it("treats a year on its own as having no month", () => {
    expect(getYearPart("2026")).toBe("2026");
    expect(getMonthPart("2026")).toBe("");
  });

  it("returns nothing for the special values", () => {
    for (const key of [ALL_MONTHS, UNKNOWN_MONTH, "", null]) {
      expect(getYearPart(key)).toBe("");
      expect(getMonthPart(key)).toBe("");
    }
  });
});

describe("matchesMonthFilter", () => {
  const august = "2026-08-15T10:00:00.000Z";
  const september = "2026-09-15T10:00:00.000Z";
  const lastYear = "2025-08-15T10:00:00.000Z";

  // The behaviour the nine screens had, which must not change.
  it("shows everything when nothing is selected", () => {
    expect(matchesMonthFilter(ALL_MONTHS, august)).toBe(true);
    expect(matchesMonthFilter(ALL_MONTHS, "")).toBe(true);
    expect(matchesMonthFilter("", august)).toBe(true);
  });

  it("matches one exact month, as the old comparison did", () => {
    expect(matchesMonthFilter("2026-08", august)).toBe(true);
    expect(matchesMonthFilter("2026-08", september)).toBe(false);
    expect(matchesMonthFilter("2026-08", lastYear)).toBe(false);
  });

  it("covers every month when only a year is selected", () => {
    expect(matchesMonthFilter("2026", august)).toBe(true);
    expect(matchesMonthFilter("2026", september)).toBe(true);
    expect(matchesMonthFilter("2026", lastYear)).toBe(false);
  });

  it("does not confuse the same month in different years", () => {
    expect(matchesMonthFilter("2025-08", august)).toBe(false);
    expect(matchesMonthFilter("2026-08", lastYear)).toBe(false);
  });

  // A record with no readable date belongs to no month, so a month selection
  // must exclude it rather than quietly showing it in every month.
  it("hides an undated record unless nothing is filtered", () => {
    expect(matchesMonthFilter("2026-08", null)).toBe(false);
    expect(matchesMonthFilter("2026", "")).toBe(false);
    expect(matchesMonthFilter(ALL_MONTHS, null)).toBe(true);
  });
});

describe("availableYears", () => {
  const byCreated = (record) => record.createdAt;

  it("lists the years present, newest first", () => {
    const records = [
      { createdAt: "2024-05-01T00:00:00.000Z" },
      { createdAt: "2026-01-01T00:00:00.000Z" },
      { createdAt: "2025-09-01T00:00:00.000Z" },
    ];

    const now = new Date("2026-08-15T00:00:00.000Z");
    expect(availableYears(records, byCreated, now)).toEqual(["2026", "2025", "2024"]);
  });

  it("lists each year once however many records it holds", () => {
    const records = [
      { createdAt: "2026-01-01T00:00:00.000Z" },
      { createdAt: "2026-06-01T00:00:00.000Z" },
      { createdAt: "2026-12-01T00:00:00.000Z" },
    ];

    const now = new Date("2026-08-15T00:00:00.000Z");
    expect(availableYears(records, byCreated, now)).toEqual(["2026"]);
  });

  // Otherwise a shop with no records yet would show an empty year selector.
  it("always includes the current year", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    expect(availableYears([], byCreated, now)).toEqual(["2026"]);
  });

  it("skips records it cannot read a date from", () => {
    const records = [{ createdAt: "" }, { createdAt: "2025-01-01T00:00:00.000Z" }];
    const now = new Date("2026-08-15T00:00:00.000Z");

    expect(availableYears(records, byCreated, now)).toEqual(["2026", "2025"]);
  });

  it("survives a missing list", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    expect(availableYears(null, byCreated, now)).toEqual(["2026"]);
  });

  // The date field differs between screens and the caller decides it, so the
  // same records can be filed by a different field without changing this code.
  it("reads whichever field the caller names", () => {
    const records = [{ date: "2024-01-01T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z" }];
    const now = new Date("2026-08-15T00:00:00.000Z");

    expect(availableYears(records, (r) => r.date, now)).toEqual(["2026", "2024"]);
    expect(availableYears(records, (r) => r.createdAt, now)).toEqual(["2026"]);
  });
});
