import { describe, it, expect, vi } from "vitest";

// catalog.js pulls in the products service, which reaches Firestore on import.
// Only the pure filtering is under test here, so the service is stubbed out.
vi.mock("../../services/products/productsService", () => ({
  getProducts: vi.fn(),
}));

const { filterProducts } = await import("./catalog");

const dress = {
  code: "FS-003",
  name: "שמלת קיץ פרחונית",
  nameEn: "Floral Summer Dress",
  gender: "נשים",
  cat: "dresses",
  price: 200,
  season: "all",
};

const shirt = {
  code: "FS-001",
  name: "חולצת לינן קלאסית",
  nameEn: "Classic Linen Shirt",
  gender: "גברים",
  cat: "shirts",
  price: 150,
  season: "all",
};

const products = [dress, shirt];
const codesFor = (search) =>
  filterProducts({ products, search }).map((p) => p.code);

describe("filterProducts — search", () => {
  it("finds a product by its Hebrew name", () => {
    expect(codesFor("שמלת")).toEqual(["FS-003"]);
  });

  it("finds the same product by its English name", () => {
    expect(codesFor("dress")).toEqual(["FS-003"]);
  });

  it("ignores case in the query", () => {
    expect(codesFor("Dress")).toEqual(["FS-003"]);
    expect(codesFor("DRESS")).toEqual(["FS-003"]);
  });

  it("ignores case in the stored name", () => {
    expect(codesFor("floral")).toEqual(["FS-003"]);
  });

  it("still finds a product by code", () => {
    expect(codesFor("FS-001")).toEqual(["FS-001"]);
  });

  it("matches a code whatever case it is typed in", () => {
    expect(codesFor("fs-001")).toEqual(["FS-001"]);
  });

  it("returns everything when the box is empty", () => {
    expect(codesFor("")).toEqual(["FS-003", "FS-001"]);
  });

  it("returns nothing for a word in neither name", () => {
    expect(codesFor("jacket")).toEqual([]);
  });

  it("does not let one product's English name match another", () => {
    expect(codesFor("shirt")).toEqual(["FS-001"]);
  });
});

describe("filterProducts — search combined with the other filters", () => {
  it("applies the gender filter alongside an English search", () => {
    expect(
      filterProducts({ products, search: "dress", gender: "גברים" }),
    ).toEqual([]);
  });

  it("applies the price filter alongside an English search", () => {
    expect(
      filterProducts({ products, search: "shirt", price: "0-100" }),
    ).toEqual([]);
  });

  it("keeps a match that satisfies every filter", () => {
    expect(
      filterProducts({
        products,
        search: "dress",
        gender: "נשים",
        category: "dresses",
      }).map((p) => p.code),
    ).toEqual(["FS-003"]);
  });
});
