import { describe, it, expect, vi, beforeEach } from "vitest";

const saved = [];

vi.mock("../../services/customer/cartFirestore", () => ({
  saveCartToFirestore: vi.fn(async (email, cart) => {
    saved.push({ email, cart });
  }),
}));

vi.mock("../../services/translation/translationService", () => ({
  translateText: vi.fn(async (text) => `EN:${text}`),
  keepPersonName: vi.fn((name) => String(name || "").trim()),
}));

const { buyGiftCard, buildGiftCardPreview } = await import("./giftCard");

const valid = {
  amount: "200",
  customAmount: "",
  name: "דנה",
  message: "מזל טוב",
  email: "buyer@example.com",
  cart: [],
};

beforeEach(() => {
  saved.length = 0;
});

describe("buyGiftCard — refusals carry a code, not a sentence", () => {
  // The function runs below the interface and cannot know the chosen
  // language. Returning a written sentence put Hebrew in front of an
  // English-speaking customer, because the page rendered it directly.
  it("refuses an empty recipient with a code", async () => {
    const result = await buyGiftCard({ ...valid, name: "   " });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("recipientRequired");
    expect(result.error).toBeUndefined();
  });

  it("refuses an amount below the minimum", async () => {
    const result = await buyGiftCard({ ...valid, amount: "5" });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("invalidAmount");
  });

  it("refuses a non-numeric custom amount", async () => {
    const result = await buyGiftCard({
      ...valid,
      amount: "other",
      customAmount: "abc",
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("invalidAmount");
  });

  it("refuses a purchase with no signed-in address", async () => {
    const result = await buyGiftCard({ ...valid, email: "" });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("loginRequired");
  });

  it("never returns text for the page to display", async () => {
    const refusals = await Promise.all([
      buyGiftCard({ ...valid, name: "" }),
      buyGiftCard({ ...valid, amount: "0" }),
      buyGiftCard({ ...valid, email: "" }),
    ]);

    for (const result of refusals) {
      expect(result.error).toBeUndefined();
      expect(typeof result.reason).toBe("string");
    }
  });

  it("writes nothing when it refuses", async () => {
    await buyGiftCard({ ...valid, name: "" });
    expect(saved).toHaveLength(0);
  });
});

describe("buyGiftCard — a successful purchase", () => {
  it("returns a code and the updated cart", async () => {
    const result = await buyGiftCard(valid);

    expect(result.ok).toBe(true);
    expect(result.code).toMatch(/^GC-[A-Z0-9]+$/);
    expect(result.nextCart).toHaveLength(1);
  });

  it("accepts a custom amount at the minimum", async () => {
    const result = await buyGiftCard({
      ...valid,
      amount: "other",
      customAmount: "10",
    });

    expect(result.ok).toBe(true);
    expect(result.nextCart[0].price).toBe(10);
  });

  it("keeps the recipient name untranslated", async () => {
    const result = await buyGiftCard(valid);
    const item = result.nextCart[0];

    expect(item.giftRecipient).toBe("דנה");
    expect(item.giftRecipientEn).toBe("דנה");
  });

  it("does translate the free-text message", async () => {
    const result = await buyGiftCard(valid);
    expect(result.nextCart[0].giftMessageEn).toBe("EN:מזל טוב");
  });

  it("marks the line as a gift card", async () => {
    const result = await buyGiftCard(valid);
    expect(result.nextCart[0].isGiftCard).toBe(true);
  });

  it("appends to an existing cart rather than replacing it", async () => {
    const existing = [{ code: "FS-001", qty: 1, price: 100 }];
    const result = await buyGiftCard({ ...valid, cart: existing });

    expect(result.nextCart).toHaveLength(2);
    expect(result.nextCart[0].code).toBe("FS-001");
  });
});

describe("buildGiftCardPreview", () => {
  it("shows the chosen amount", () => {
    expect(buildGiftCardPreview({ amount: "200" }).previewAmount).toBe("200");
  });

  it("falls back to a placeholder with no name", () => {
    expect(buildGiftCardPreview({ amount: "200" }).previewName).toBe("—");
  });

  it("shows a question mark for an empty custom amount", () => {
    const preview = buildGiftCardPreview({ amount: "other", customAmount: "" });
    expect(preview.previewAmount).toBe("?");
  });
});
