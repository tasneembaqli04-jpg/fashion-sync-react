import { describe, it, expect } from "vitest";
import { canCancelOrder, canRequestReturn } from "./orderPolicy";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe("canCancelOrder", () => {
  it("returns false for a null/undefined order", () => {
    expect(canCancelOrder(null)).toBe(false);
    expect(canCancelOrder(undefined)).toBe(false);
  });

  it("returns false if the order was already cancelled", () => {
    const order = { cancelled: true, status: 0, createdAt: new Date().toISOString() };
    expect(canCancelOrder(order)).toBe(false);
  });

  it("returns false if the order already reached the final delivery stage", () => {
    const order = { cancelled: false, status: 3, createdAt: new Date().toISOString() };
    expect(canCancelOrder(order)).toBe(false);
  });

  it("returns true within the 24-hour cancellation window", () => {
    const now = Date.now();
    const order = {
      cancelled: false,
      status: 0,
      createdAt: new Date(now - 1 * HOUR).toISOString(),
    };
    expect(canCancelOrder(order, now)).toBe(true);
  });

  it("returns true right at the edge, just under 24 hours", () => {
    const now = Date.now();
    const order = {
      cancelled: false,
      status: 0,
      createdAt: new Date(now - (DAY - 1000)).toISOString(),
    };
    expect(canCancelOrder(order, now)).toBe(true);
  });

  it("returns false once the 24-hour window has passed", () => {
    const now = Date.now();
    const order = {
      cancelled: false,
      status: 0,
      createdAt: new Date(now - 25 * HOUR).toISOString(),
    };
    expect(canCancelOrder(order, now)).toBe(false);
  });

  it("falls back to the 'date' field when createdAt is missing", () => {
    const now = Date.now();
    const order = {
      cancelled: false,
      status: 0,
      date: new Date(now - 1 * HOUR).toISOString(),
    };
    expect(canCancelOrder(order, now)).toBe(true);
  });

  it("returns false when there is no usable date at all", () => {
    const order = { cancelled: false, status: 0 };
    expect(canCancelOrder(order)).toBe(false);
  });
});

describe("canRequestReturn", () => {
  it("returns false for a null/undefined order", () => {
    expect(canRequestReturn(null)).toBe(false);
  });

  it("returns false if the order has not reached the final delivery stage", () => {
    const order = { status: 2, deliveredAt: new Date().toISOString() };
    expect(canRequestReturn(order)).toBe(false);
  });

  it("returns true within the 7-day return window after delivery", () => {
    const now = Date.now();
    const order = {
      status: 3,
      deliveredAt: new Date(now - 3 * DAY).toISOString(),
    };
    expect(canRequestReturn(order, now)).toBe(true);
  });

  it("returns true right at the edge, just under 7 days", () => {
    const now = Date.now();
    const order = {
      status: 3,
      deliveredAt: new Date(now - (7 * DAY - 1000)).toISOString(),
    };
    expect(canRequestReturn(order, now)).toBe(true);
  });

  it("returns false once the 7-day return window has passed", () => {
    const now = Date.now();
    const order = {
      status: 3,
      deliveredAt: new Date(now - 8 * DAY).toISOString(),
    };
    expect(canRequestReturn(order, now)).toBe(false);
  });

  it("falls back to createdAt when deliveredAt is missing", () => {
    const now = Date.now();
    const order = {
      status: 3,
      createdAt: new Date(now - 2 * DAY).toISOString(),
    };
    expect(canRequestReturn(order, now)).toBe(true);
  });

  it("returns false when there is no usable date at all", () => {
    const order = { status: 3 };
    expect(canRequestReturn(order)).toBe(false);
  });
});