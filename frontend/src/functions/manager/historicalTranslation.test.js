import { describe, it, expect } from "vitest";
import {
  needsTranslation,
  needsPersonNameFill,
  countOrderGaps,
  countProductGaps,
  countOutstandingTranslations,
  selectRecordsNeedingTranslation,
} from "./historicalTranslation";

describe("needsTranslation", () => {
  it("is false when there is nothing to translate", () => {
    expect(needsTranslation("", "")).toBe(false);
    expect(needsTranslation(undefined, undefined)).toBe(false);
  });

  it("is true when the English field is empty", () => {
    expect(needsTranslation("שמלה", "")).toBe(true);
    expect(needsTranslation("שמלה", undefined)).toBe(true);
  });

  // A stored value identical to the Hebrew is what a failed translation looks
  // like afterwards, so it counts as outstanding rather than done.
  it("is true when the translation came back unchanged", () => {
    expect(needsTranslation("שמלה", "שמלה")).toBe(true);
    expect(needsTranslation("שמלה", "  שמלה  ")).toBe(true);
  });

  it("is false for a real translation", () => {
    expect(needsTranslation("שמלה", "Dress")).toBe(false);
  });
});

describe("needsPersonNameFill", () => {
  it("is true only while the English field is empty", () => {
    expect(needsPersonNameFill("דנה", "")).toBe(true);
    expect(needsPersonNameFill("דנה", undefined)).toBe(true);
  });

  // Names are mirrored rather than translated, so identical values are the
  // finished state. Judged as a translation, every name would be reported as
  // failing on every sweep, for ever.
  it("is false once the name has been mirrored", () => {
    expect(needsPersonNameFill("דנה", "דנה")).toBe(false);
  });

  it("is false when there is no name", () => {
    expect(needsPersonNameFill("", "")).toBe(false);
  });
});

describe("countOrderGaps", () => {
  it("counts an item whose English name is missing", () => {
    const order = { items: [{ name: "שמלה", nameEn: "" }] };
    expect(countOrderGaps(order)).toBe(1);
  });

  it("counts a gift card recipient and message separately", () => {
    const order = {
      items: [
        {
          name: "כרטיס",
          nameEn: "Gift Card",
          isGiftCard: true,
          giftRecipient: "דנה",
          giftRecipientEn: "",
          giftMessage: "מזל טוב",
          giftMessageEn: "",
        },
      ],
    };

    expect(countOrderGaps(order)).toBe(2);
  });

  it("does not count a mirrored recipient name", () => {
    const order = {
      items: [
        {
          name: "כרטיס",
          nameEn: "Gift Card",
          isGiftCard: true,
          giftRecipient: "דנה",
          giftRecipientEn: "דנה",
          giftMessage: "מזל טוב",
          giftMessageEn: "Congratulations",
        },
      ],
    };

    expect(countOrderGaps(order)).toBe(0);
  });

  it("counts the customer address but not a mirrored name", () => {
    const order = {
      items: [],
      customerEmbedded: {
        name: "דנה",
        nameEn: "דנה",
        city: "תל אביב",
        cityEn: "",
        street: "דיזנגוף",
        streetEn: "Dizengoff",
      },
    };

    expect(countOrderGaps(order)).toBe(1);
  });

  it("falls back to customerDetails when nothing is embedded", () => {
    const order = {
      items: [],
      customerDetails: { city: "חיפה", cityEn: "" },
    };

    expect(countOrderGaps(order)).toBe(1);
  });

  it("survives an order with no items and no customer", () => {
    expect(countOrderGaps({})).toBe(0);
    expect(countOrderGaps(null)).toBe(0);
  });
});

describe("countProductGaps", () => {
  it("counts name, description and each colour", () => {
    const product = {
      name: "שמלה",
      nameEn: "",
      desc: "תיאור",
      descEn: "",
      variants: [
        { colorName: "שחור", colorNameEn: "" },
        { colorName: "לבן", colorNameEn: "White" },
      ],
    };

    expect(countProductGaps(product)).toBe(3);
  });

  it("counts nothing for a fully translated product", () => {
    const product = {
      name: "שמלה",
      nameEn: "Dress",
      desc: "תיאור",
      descEn: "Description",
      variants: [{ colorName: "שחור", colorNameEn: "Black" }],
    };

    expect(countProductGaps(product)).toBe(0);
  });

  it("survives a product with no variants", () => {
    expect(countProductGaps({ name: "שמלה", nameEn: "Dress" })).toBe(0);
  });
});

describe("countOutstandingTranslations", () => {
  // The badge counts fields, not records: one product missing two fields is
  // two pieces of work.
  it("adds up every source", () => {
    const total = countOutstandingTranslations({
      orders: [{ items: [{ name: "שמלה", nameEn: "" }] }],
      contactMessages: [{ name: "דנה", nameEn: "", message: "שלום", messageEn: "" }],
      feedback: [{ text: "מעולה", textEn: "" }],
      customers: [{ name: "רות", nameEn: "", city: "אילת", cityEn: "" }],
      products: [{ name: "חולצה", nameEn: "", desc: "תיאור", descEn: "" }],
    });

    expect(total).toBe(1 + 2 + 1 + 2 + 2);
  });

  it("is zero for a fully translated shop", () => {
    expect(
      countOutstandingTranslations({
        orders: [{ items: [{ name: "שמלה", nameEn: "Dress" }] }],
        products: [{ name: "חולצה", nameEn: "Shirt", desc: "ד", descEn: "D" }],
      })
    ).toBe(0);
  });

  it("is zero for an empty shop", () => {
    expect(countOutstandingTranslations()).toBe(0);
    expect(countOutstandingTranslations({})).toBe(0);
  });
});

describe("selectRecordsNeedingTranslation", () => {
  // The sweep writes whole documents, so this counts records while the badge
  // counts fields. The two figures are allowed to differ.
  it("returns only the records with something outstanding", () => {
    const result = selectRecordsNeedingTranslation({
      products: [
        { code: "FS-1", name: "שמלה", nameEn: "" },
        { code: "FS-2", name: "חולצה", nameEn: "Shirt", desc: "ד", descEn: "D" },
      ],
    });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].code).toBe("FS-1");
    expect(result.total).toBe(1);
  });

  it("counts a record once however many fields it is missing", () => {
    const product = { name: "שמלה", nameEn: "", desc: "תיאור", descEn: "" };

    expect(countProductGaps(product)).toBe(2);
    expect(selectRecordsNeedingTranslation({ products: [product] }).total).toBe(1);
  });

  it("totals across all five sources", () => {
    const result = selectRecordsNeedingTranslation({
      orders: [{ items: [{ name: "שמלה", nameEn: "" }] }],
      contactMessages: [{ message: "שלום", messageEn: "" }],
      feedback: [{ text: "מעולה", textEn: "" }],
      customers: [{ city: "אילת", cityEn: "" }],
      products: [{ name: "חולצה", nameEn: "" }],
    });

    expect(result.total).toBe(5);
  });

  it("returns empty lists and a zero total for a clean shop", () => {
    const result = selectRecordsNeedingTranslation({
      products: [{ name: "חולצה", nameEn: "Shirt" }],
    });

    expect(result.total).toBe(0);
    expect(result.products).toEqual([]);
  });

  it("survives being called with nothing", () => {
    expect(selectRecordsNeedingTranslation().total).toBe(0);
  });
});
