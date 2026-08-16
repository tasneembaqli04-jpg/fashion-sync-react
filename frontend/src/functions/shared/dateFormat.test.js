import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, localeFor } from "./dateFormat";

const ISO = "2026-08-06T15:30:17.530Z";

describe("localeFor", () => {
  it("maps en to en-US", () => {
    expect(localeFor("en")).toBe("en-US");
  });

  it("maps anything else to he-IL", () => {
    expect(localeFor("he")).toBe("he-IL");
    expect(localeFor(undefined)).toBe("he-IL");
  });
});

describe("formatDateTime", () => {
  it("does not return the raw value", () => {
    const output = formatDateTime(ISO, "he");
    expect(output).not.toBe(ISO);
    expect(output).not.toContain("T");
    expect(output).not.toContain("Z");
  });

  it("includes the day, month, short year and time", () => {
    const output = formatDateTime(ISO, "en");
    expect(output).toContain("08");
    expect(output).toContain("06");
    expect(output).toContain("26");
  });

  it("prints four digits of year when asked", () => {
    expect(formatDateTime(ISO, "en", { fullYear: true })).toContain("2026");
  });

  it("formats the same instant differently per language", () => {
    expect(formatDateTime(ISO, "en")).not.toBe(formatDateTime(ISO, "he"));
  });

  it("returns an empty string for a missing value", () => {
    expect(formatDateTime(null, "he")).toBe("");
    expect(formatDateTime(undefined, "he")).toBe("");
    expect(formatDateTime("", "he")).toBe("");
  });

  it("returns an empty string rather than the epoch", () => {
    // The reason the guard exists: new Date(null) is 1 January 1970.
    expect(formatDateTime(null, "he")).not.toContain("70");
  });

  it("returns an empty string for an unreadable value", () => {
    expect(formatDateTime("not a date", "he")).toBe("");
  });
});

describe("formatDate", () => {
  it("omits the time", () => {
    const withTime = formatDateTime(ISO, "en");
    const withoutTime = formatDate(ISO, "en");
    expect(withoutTime.length).toBeLessThan(withTime.length);
  });

  it("keeps the day and month", () => {
    const output = formatDate(ISO, "en");
    expect(output).toContain("08");
    expect(output).toContain("06");
  });

  it("prints four digits of year when asked", () => {
    expect(formatDate(ISO, "en", { fullYear: true })).toContain("2026");
  });

  it("returns an empty string for a missing or unreadable value", () => {
    expect(formatDate(null, "he")).toBe("");
    expect(formatDate("not a date", "he")).toBe("");
  });

  it("handles a plain YYYY-MM-DD value", () => {
    expect(formatDate("2026-08-20", "he")).not.toBe("");
    expect(formatDate("2026-08-20", "he")).not.toContain("-");
  });
});
