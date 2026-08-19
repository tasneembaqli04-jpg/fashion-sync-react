import { describe, it, expect } from "vitest";
import {
  openGiftCardBalance,
  soldGiftCards,
  totalIssuedValue,
} from "./giftCardStats";

const card = (amount, balance, status = "active") => ({
  amount,
  balance,
  status,
});

const cards = [
  card(100, 100),
  card(200, 50),
  card(300, 0, "used"),
  card(500, 500, "rejected"),
  card(50, 50, "pending"),
];

describe("soldGiftCards", () => {
  it("leaves out a card that was refused", () => {
    expect(soldGiftCards(cards)).toHaveLength(4);
  });

  it("keeps a card still awaiting approval", () => {
    expect(soldGiftCards(cards).some((c) => c.status === "pending")).toBe(true);
  });

  it("keeps a card that has been fully spent", () => {
    expect(soldGiftCards(cards).some((c) => c.status === "used")).toBe(true);
  });

  it("survives a missing list", () => {
    expect(soldGiftCards()).toEqual([]);
    expect(soldGiftCards(null)).toEqual([]);
  });
});

describe("totalIssuedValue", () => {
  it("sums the face value of the cards that stand", () => {
    // 100 + 200 + 300 + 50, with the rejected 500 left out.
    expect(totalIssuedValue(cards)).toBe(650);
  });

  it("is zero for an empty list", () => {
    expect(totalIssuedValue([])).toBe(0);
  });

  it("treats a missing amount as zero rather than NaN", () => {
    expect(totalIssuedValue([{ status: "active" }])).toBe(0);
  });
});

describe("openGiftCardBalance", () => {
  it("sums what is still unspent", () => {
    // 100 + 50 + 0 + 50, with the rejected card left out.
    expect(openGiftCardBalance(cards)).toBe(200);
  });

  it("is not the same as the face value once a card is spent", () => {
    expect(openGiftCardBalance(cards)).not.toBe(totalIssuedValue(cards));
  });

  it("is zero when every card has been spent", () => {
    expect(openGiftCardBalance([card(100, 0, "used")])).toBe(0);
  });

  it("never counts a refused card as an outstanding liability", () => {
    expect(openGiftCardBalance([card(500, 500, "rejected")])).toBe(0);
  });
});
