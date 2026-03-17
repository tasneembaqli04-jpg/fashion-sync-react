import { LS_KEYS } from "../../data/constants";
import { PRODUCTS_SEED } from "../../data/products";

export const SEASON_META = {
  קיץ: { emoji: "☀️", text: "עכשיו קיץ! מוצגים פריטי הקיץ", cls: "summer" },
  חורף: { emoji: "❄️", text: "עכשיו חורף! מוצגים פריטי החורף", cls: "winter" },
  "אביב-סתיו": { emoji: "🌸", text: "עכשיו אביב/סתיו!", cls: "spring" },
};

export function loadProducts() {
  const stored = JSON.parse(localStorage.getItem(LS_KEYS.PRODUCTS) || "null");

  if (Array.isArray(stored) && stored.length) {
    return stored.map((product) => {
      if (!product.season) {
        const seed = PRODUCTS_SEED.find((item) => item.code === product.code);
        return seed ? { ...product, season: seed.season } : { ...product, season: "כל השנה" };
      }
      return product;
    });
  }

  return PRODUCTS_SEED;
}

export function filterProducts({
  products,
  search = "",
  gender = "",
  category = "",
  price = "",
  sale = "",
  seasonTab = "all",
  listMode = "all",
}) {
  let list = products.filter((product) => {
    const matchSearch =
      !search || product.name.includes(search) || product.code.includes(search);

    const matchGender = !gender || product.gender === gender;
    const matchCategory = !category || product.cat === category;

    let matchPrice = true;
    if (price) {
      const [min, max] = price.split("-").map(Number);
      matchPrice = product.price >= min && product.price <= max;
    }

    const matchSale = !sale || (sale === "sale" && product.sale);

    const productSeasons = Array.isArray(product.season)
      ? product.season
      : [product.season];

    const matchSeason =
      seasonTab === "all" ||
      productSeasons.includes("כל השנה") ||
      productSeasons.includes(seasonTab);

    return (
      matchSearch &&
      matchGender &&
      matchCategory &&
      matchPrice &&
      matchSale &&
      matchSeason
    );
  });

  if (listMode === "trending") list = list.filter((p) => p.trending);
  if (listMode === "bestsellers") list = list.filter((p) => p.bestseller);
  if (listMode === "sale") list = list.filter((p) => p.sale);

  return list;
}