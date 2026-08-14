import { describe, it, expect } from "vitest";
import { resolveTimestamp } from "./dates";

const ISO = "2026-08-01T09:00:00.000Z";
const LATER = "2026-08-01T09:00:05.000Z";

describe("resolveTimestamp", () => {
  it("returns the first candidate when it parses", () => {
    expect(resolveTimestamp(ISO, LATER)).toBe(new Date(ISO).getTime());
  });

  it("falls through to the second candidate when the first is missing", () => {
    expect(resolveTimestamp(undefined, LATER)).toBe(new Date(LATER).getTime());
  });

  // The hole a plain `a || b` chain leaves: new Date(null) is the epoch, not
  // an invalid date, so a null field reads as 1 January 1970.
  it("skips null instead of reading it as 1970", () => {
    expect(resolveTimestamp(null, LATER)).toBe(new Date(LATER).getTime());
  });

  it("skips an empty string", () => {
    expect(resolveTimestamp("", LATER)).toBe(new Date(LATER).getTime());
  });

  // The second hole: `||` keeps a truthy but unparseable value and then yields
  // NaN, without ever consulting the later candidates.
  it("skips a present but unparseable value", () => {
    expect(resolveTimestamp("not a date", LATER)).toBe(new Date(LATER).getTime());
  });

  it("returns null when nothing parses", () => {
    expect(resolveTimestamp(null, undefined, "")).toBeNull();
    expect(resolveTimestamp("nonsense", "also nonsense")).toBeNull();
    expect(resolveTimestamp()).toBeNull();
  });

  it("never returns 0 for an all-empty input", () => {
    expect(resolveTimestamp(null, null)).not.toBe(0);
  });

  it("accepts a Date instance and a numeric timestamp", () => {
    const time = new Date(ISO).getTime();
    expect(resolveTimestamp(new Date(ISO))).toBe(time);
    expect(resolveTimestamp(time)).toBe(time);
  });

  it("keeps a legitimate epoch timestamp when it is passed explicitly", () => {
    expect(resolveTimestamp(0)).toBe(0);
  });
});
