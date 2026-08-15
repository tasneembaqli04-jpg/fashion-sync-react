import { describe, it, expect } from "vitest";
import { validateBusinessHours, isValidTime } from "./businessHoursPolicy";

const messages = {
  closeBeforeOpen: "{day}: {close} must be after {open}",
  invalidTime: "{day}: invalid time",
};

const dayNames = { sun: "Sunday", mon: "Monday" };

const day = (key, open, openTime, closeTime) => ({
  key,
  open,
  openTime,
  closeTime,
});

describe("isValidTime", () => {
  it("accepts a padded 24-hour time", () => {
    expect(isValidTime("09:00")).toBe(true);
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
  });

  // The shape alone is not enough: times are compared as strings elsewhere,
  // so an out-of-range value would sort rather than fail.
  it("rejects hours and minutes out of range", () => {
    expect(isValidTime("99:99")).toBe(false);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("12:60")).toBe(false);
  });

  it("rejects anything unpadded or malformed", () => {
    expect(isValidTime("9:00")).toBe(false);
    expect(isValidTime("0900")).toBe(false);
    expect(isValidTime("")).toBe(false);
    expect(isValidTime(null)).toBe(false);
  });
});

describe("validateBusinessHours", () => {
  it("accepts an ordinary week", () => {
    const week = [
      day("sun", true, "09:00", "18:00"),
      day("mon", true, "09:00", "21:00"),
    ];

    expect(validateBusinessHours(week, messages, dayNames)).toBe("");
  });

  // The case that reached customers: closing before opening passes every
  // write, then no pickup slot can satisfy time >= open && time <= close, so
  // every booking is refused with nothing on screen to explain it.
  it("rejects a day that closes before it opens", () => {
    const week = [day("sun", true, "21:00", "09:00")];
    const result = validateBusinessHours(week, messages, dayNames);

    expect(result).toBe("Sunday: 09:00 must be after 21:00");
  });

  it("rejects a day that opens and closes at the same minute", () => {
    const week = [day("mon", true, "09:00", "09:00")];
    expect(validateBusinessHours(week, messages, dayNames)).toContain("Monday");
  });

  it("rejects an out-of-range time", () => {
    const week = [day("sun", true, "09:00", "99:99")];
    expect(validateBusinessHours(week, messages, dayNames)).toBe(
      "Sunday: invalid time"
    );
  });

  it("ignores the times on a day that is closed", () => {
    const week = [day("sun", false, "21:00", "09:00")];
    expect(validateBusinessHours(week, messages, dayNames)).toBe("");
  });

  it("names the first day that is wrong", () => {
    const week = [
      day("sun", true, "09:00", "18:00"),
      day("mon", true, "22:00", "08:00"),
    ];

    expect(validateBusinessHours(week, messages, dayNames)).toContain("Monday");
  });

  it("accepts an empty or missing schedule", () => {
    expect(validateBusinessHours([], messages, dayNames)).toBe("");
    expect(validateBusinessHours(undefined, messages, dayNames)).toBe("");
    expect(validateBusinessHours(null, messages, dayNames)).toBe("");
  });

  it("falls back to the day key when no display name is supplied", () => {
    const week = [day("sun", true, "21:00", "09:00")];
    expect(validateBusinessHours(week, messages)).toContain("sun");
  });
});
