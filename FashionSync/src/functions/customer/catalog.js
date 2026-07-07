import { getProducts } from "../products/productsService";
export const SEASON_META = {
  summer: { emoji: "☀️", text: "עכשיו קיץ! מוצגים פריטי הקיץ", cls: "summer" },
  winter: { emoji: "❄️", text: "עכשיו חורף! מוצגים פריטי החורף", cls: "winter" },
  "spring-autumn": { emoji: "🌸", text: "עכשיו אביב/סתיו!", cls: "spring" },
};

export async function loadProducts() {
  return await getProducts();
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
  promotedCode = "",
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
      productSeasons.includes("all") ||
      productSeasons.includes(seasonTab);

    return matchSearch && matchGender && matchCategory && matchPrice && matchSale && matchSeason;
  });

  if (listMode === "trending") list = list.filter((p) => p.trending);
  if (listMode === "bestsellers") list = list.filter((p) => p.bestseller);
  if (listMode === "sale") list = list.filter((p) => p.sale);

  const normalizedPromotedCode = (promotedCode || "").toUpperCase();
  if (normalizedPromotedCode) {
    const idx = list.findIndex((p) => p.code.toUpperCase() === normalizedPromotedCode);
    if (idx > 0) {
      const [item] = list.splice(idx, 1);
      list.unshift(item);
    }
  }

  return list;
}
export function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 12 || month <= 2) return "winter";
  return "spring-autumn";
}