import { describe, it, expect } from "vitest";
import { buildReturnCreditMessage } from "./returnCredit";

describe("buildReturnCreditMessage", () => {
  it("builds both languages from the matching name", () => {
    const { message, messageEn } = buildReturnCreditMessage(
      "שמלת ערב",
      "Evening Dress",
    );

    expect(message).toBe("זיכוי אוטומטי עבור החזרת שמלת ערב");
    expect(messageEn).toBe("Automatic credit for the return of Evening Dress");
  });

  // The defect this replaces: one Hebrew sentence was stored and shown to
  // every customer, whatever language she was reading in.
  it("never leaves Hebrew in the English sentence when a name is translated", () => {
    const { messageEn } = buildReturnCreditMessage("שמלת ערב", "Evening Dress");
    expect(messageEn).not.toMatch(/[֐-׿]/);
  });

  it("falls back to the Hebrew name when the line has no English one", () => {
    const { message, messageEn } = buildReturnCreditMessage("שמלת ערב", "");

    expect(message).toBe("זיכוי אוטומטי עבור החזרת שמלת ערב");
    expect(messageEn).toBe("Automatic credit for the return of שמלת ערב");
  });

  it("falls back to a generic word when there is no name at all", () => {
    const { message, messageEn } = buildReturnCreditMessage("", "");

    expect(message).toBe("זיכוי אוטומטי עבור החזרת פריט");
    expect(messageEn).toBe("Automatic credit for the return of an item");
  });

  it("treats a missing argument the same as an empty one", () => {
    expect(buildReturnCreditMessage()).toEqual(
      buildReturnCreditMessage("", ""),
    );
  });

  it("leaves no placeholder behind in either language", () => {
    const both = buildReturnCreditMessage("שמלת ערב", "Evening Dress");
    expect(both.message).not.toContain("{item}");
    expect(both.messageEn).not.toContain("{item}");
  });
});
