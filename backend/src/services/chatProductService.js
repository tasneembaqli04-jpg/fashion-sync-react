const {db} = require("../config/firebaseAdmin");

const PRODUCTS_COLLECTION = "products";
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 100;

/**
 * Normalizes text for safe comparisons.
 *
 * @param {*} value Value to normalize.
 * @return {string} Normalized text.
 */
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[׳’‘`]/g, "'")
    .replace(/[״“”]/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Converts a Firestore document into a normalized product object.
 *
 * @param {FirebaseFirestore.DocumentSnapshot} documentSnapshot
 * Firestore product document.
 * @return {object} Normalized product.
 */
function normalizeProduct(documentSnapshot) {
  const data = documentSnapshot.data() || {};

  return {
    id: documentSnapshot.id,
    code: data.code || documentSnapshot.id,
    name: data.name || "",
    category: data.cat || data.category || "",
    gender: data.gender || "",
    price: Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    img: data.img || "",
    desc: data.desc || "",
    sale: data.sale || null,
    variants: Array.isArray(data.variants) ? data.variants : [],
    bestseller: Boolean(data.bestseller),
    trending: Boolean(data.trending),
  };
}

/**
 * Checks whether a product matches free-text search.
 *
 * @param {object} product Product to inspect.
 * @param {string} searchText Requested search text.
 * @return {boolean} Whether the product matches.
 */
function productMatchesText(product, searchText) {
  if (!searchText) {
    return true;
  }

  const normalizedSearch = normalizeText(searchText);

  const searchableText = normalizeText(
    [
      product.code,
      product.name,
      product.category,
      product.gender,
      product.desc,
    ].join(" ")
  );

  return searchableText.includes(normalizedSearch);
}

/**
 * Checks whether a product has a requested size in stock.
 *
 * Supports both the old array format and the current object format.
 *
 * @param {object} product Product to inspect.
 * @param {string|null} requestedSize Requested size.
 * @return {boolean} Whether the requested size is available.
 */
function productHasSize(product, requestedSize) {
  if (!requestedSize) {
    return true;
  }

  const normalizedRequestedSize =
    normalizeText(requestedSize).toUpperCase();

  return product.variants.some((variant) => {
    const sizes = variant?.sizes;

    if (Array.isArray(sizes)) {
      return sizes.some((size) => {
        if (
          typeof size === "string" ||
          typeof size === "number"
        ) {
          return (
            String(size).toUpperCase() ===
            normalizedRequestedSize
          );
        }

        const sizeValue =
          size?.size ||
          size?.name ||
          size?.label ||
          size?.value ||
          "";

        const quantity =
          size?.quantity ??
          size?.stock ??
          size?.qty ??
          null;

        const matchesSize =
          String(sizeValue).toUpperCase() ===
          normalizedRequestedSize;

        if (quantity === null || quantity === undefined) {
          return matchesSize;
        }

        return matchesSize && Number(quantity) > 0;
      });
    }

    if (sizes && typeof sizes === "object") {
      return Object.entries(sizes).some(
        ([sizeName, quantity]) =>
          String(sizeName).toUpperCase() ===
            normalizedRequestedSize &&
          Number(quantity) > 0
      );
    }

    return false;
  });
}

/**
 * Checks whether a product has the requested color.
 *
 * @param {object} product Product to inspect.
 * @param {string|null} requestedColor Requested color.
 * @return {boolean} Whether the product matches the color.
 */
function productHasColor(product, requestedColor) {
  if (!requestedColor) {
    return true;
  }

  const normalizedRequestedColor =
    normalizeText(requestedColor);

  return product.variants.some((variant) => {
    const colorName =
      variant?.colorName ||
      variant?.color ||
      variant?.name ||
      "";

    const normalizedColorName = normalizeText(colorName);

    return (
      normalizedColorName.includes(normalizedRequestedColor) ||
      normalizedRequestedColor.includes(normalizedColorName)
    );
  });
}

/**
 * Checks whether a product is currently on sale.
 *
 * @param {object} product Product to inspect.
 * @return {boolean} Whether the product is on sale.
 */
function isProductOnSale(product) {
  if (!product.sale) {
    return false;
  }

  if (typeof product.sale === "boolean") {
    return product.sale;
  }

  if (typeof product.sale === "number") {
    return product.sale > 0;
  }

  if (typeof product.sale === "object") {
    return Boolean(
      product.sale.active ||
      product.sale.enabled ||
      Number(product.sale.discount) > 0 ||
      Number(product.sale.percent) > 0
    );
  }

  return false;
}

/**
 * Calculates the available product stock.
 *
 * Uses both the direct stock field and stock stored inside variants.
 *
 * @param {object} product Product to inspect.
 * @return {number} Available stock.
 */
function getProductAvailableStock(product) {
  const variantStock = product.variants.reduce(
    (total, variant) => {
      const sizes = variant?.sizes;

      if (Array.isArray(sizes)) {
        const sizesStock = sizes.reduce(
          (sizeTotal, size) => {
            if (typeof size === "number") {
              return sizeTotal + Math.max(size, 0);
            }

            if (size && typeof size === "object") {
              const quantity = Number(
                size.quantity ??
                size.stock ??
                size.qty ??
                0
              );

              return (
                sizeTotal +
                Math.max(quantity || 0, 0)
              );
            }

            return sizeTotal;
          },
          0
        );

        return total + sizesStock;
      }

      if (sizes && typeof sizes === "object") {
        const sizesStock = Object.values(sizes).reduce(
          (sizeTotal, quantity) =>
            sizeTotal +
            Math.max(Number(quantity) || 0, 0),
          0
        );

        return total + sizesStock;
      }

      return total;
    },
    0
  );

  return Math.max(
    Number(product.stock) || 0,
    variantStock
  );
}

/**
 * Finds a product by its code.
 *
 * @param {string} code Product code.
 * @return {Promise<object|null>} Matching product or null.
 */
async function getProductByCode(code) {
  if (!code) {
    return null;
  }

  const normalizedCode =
    String(code).trim().toUpperCase();

  const directDocument = await db
    .collection(PRODUCTS_COLLECTION)
    .doc(normalizedCode)
    .get();

  if (directDocument.exists) {
    return normalizeProduct(directDocument);
  }

  const querySnapshot = await db
    .collection(PRODUCTS_COLLECTION)
    .where("code", "==", normalizedCode)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  return normalizeProduct(querySnapshot.docs[0]);
}

/**
 * Searches the product catalog using structured filters.
 *
 * @param {object} options Search options.
 * @param {string} options.searchText Free-text search.
 * @param {string|null} options.category Product category.
 * @param {string|null} options.gender Product gender.
 * @param {string|null} options.size Requested size.
 * @param {string|null} options.color Requested color.
 * @param {number|null} options.maxPrice Maximum price.
 * @param {number|null} options.minPrice Minimum price.
 * @param {boolean} options.inStockOnly Whether to require stock.
 * @param {boolean} options.saleOnly Whether to require a sale.
 * @param {number} options.limit Maximum number of results.
 * @return {Promise<object[]>} Matching products.
 */
async function searchProducts({
  searchText = "",
  category = null,
  gender = null,
  size = null,
  color = null,
  maxPrice = null,
  minPrice = null,
  inStockOnly = false,
  saleOnly = false,
  limit = DEFAULT_LIMIT,
} = {}) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const snapshot = await db
    .collection(PRODUCTS_COLLECTION)
    .limit(200)
    .get();

  let products = snapshot.docs.map(normalizeProduct);

  products = products.filter((product) => {
    if (
      category &&
      normalizeText(product.category) !==
        normalizeText(category)
    ) {
      return false;
    }

    if (
      gender &&
      normalizeText(product.gender) !==
        normalizeText(gender)
    ) {
      return false;
    }

    if (!productMatchesText(product, searchText)) {
      return false;
    }

    if (
      maxPrice !== null &&
      product.price > Number(maxPrice)
    ) {
      return false;
    }

    if (
      minPrice !== null &&
      product.price < Number(minPrice)
    ) {
      return false;
    }

    if (
      inStockOnly &&
      getProductAvailableStock(product) <= 0
    ) {
      return false;
    }

    if (!productHasSize(product, size)) {
      return false;
    }

    if (!productHasColor(product, color)) {
      return false;
    }

    if (saleOnly && !isProductOnSale(product)) {
      return false;
    }

    return true;
  });

  products.sort((firstProduct, secondProduct) => {
    const firstStock =
      getProductAvailableStock(firstProduct);

    const secondStock =
      getProductAvailableStock(secondProduct);

    if (firstStock > 0 && secondStock <= 0) {
      return -1;
    }

    if (firstStock <= 0 && secondStock > 0) {
      return 1;
    }

    return firstProduct.price - secondProduct.price;
  });

  console.log("CHAT PRODUCTS FOUND:", products.length);

  return products.slice(0, safeLimit);
}

module.exports = {
  getProductByCode,
  searchProducts,
};