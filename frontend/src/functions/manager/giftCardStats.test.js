import { describe, it, expect } from "vitest";
import {
  openGiftCardBalance,
  soldGiftCards,
  totalIssuedValue,
} from "./giftCardStats";
import { matchesMonthFilter } from "../shared/monthFilter";

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

describe("what the month selector may and may not narrow", () => {
  // The screen shows three figures over a month selector. Two of them follow
  // it and one does not, and the difference is not a preference.
  //
  // Cards sold and their value measure activity, which belongs to a period.
  // The open balance is a liability: a card sold in June and never spent is
  // money the shop owes today. Filtering it to August would report no debt
  // while the customer can still walk in and redeem it, so it is always read
  // over every card.
  const june = { amount: 100, balance: 100, status: "active", date: "2026-06-10T10:00:00.000Z" };
  const august = { amount: 300, balance: 120, status: "active", date: "2026-08-10T10:00:00.000Z" };
  const all = [june, august];

  const inMonth = (month) => all.filter((c) => matchesMonthFilter(month, c.date));

  it("narrows the cards sold to the month chosen", () => {
    expect(soldGiftCards(inMonth("2026-08"))).toHaveLength(1);
    expect(soldGiftCards(inMonth("2026-06"))).toHaveLength(1);
    expect(soldGiftCards(inMonth("all"))).toHaveLength(2);
  });

  it("narrows the value issued to the month chosen", () => {
    expect(totalIssuedValue(inMonth("2026-08"))).toBe(300);
    expect(totalIssuedValue(inMonth("2026-06"))).toBe(100);
    expect(totalIssuedValue(inMonth("all"))).toBe(400);
  });

  it("reads the open balance over every card, whatever month is chosen", () => {
    // The screen passes the unfiltered list here on purpose. June's unspent
    // 100 is still owed while August is on screen.
    const owed = openGiftCardBalance(all);

    expect(owed).toBe(220);
    expect(owed).toBe(openGiftCardBalance(all));
  });

  it("would understate the debt if it were filtered, which is why it is not", () => {
    // This is the mistake the screen must not make: it hides June's card and
    // reports 120 owed when the shop owes 220.
    const filtered = openGiftCardBalance(inMonth("2026-08"));

    expect(filtered).toBe(120);
    expect(filtered).toBeLessThan(openGiftCardBalance(all));
  });
});
