import { getFeaturedProduct } from "../../backend/services/settings/featuredProductService.js";

export async function loadFeaturedImage() {
  const featured = await getFeaturedProduct();
  return featured?.img || "";
}