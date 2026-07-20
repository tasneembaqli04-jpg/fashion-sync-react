const { db } = require("../config/firebaseAdmin");

const PRODUCTS_COLLECTION = "products";
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[׳’‘`]/g, "'")
    .replace(/[״“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

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

function productHasSize(product, requestedSize) {
  if (!requestedSize) {
    return true;
  }

  const normalizedRequestedSize = normalizeText(requestedSize).toUpperCase();

  return product.variants.some((variant) => {
    const sizes = Array.isArray(variant?.sizes) ? variant.sizes : [];

    return sizes.some((size) => {
      if (typeof size === "string" || typeof size === "number") {
        return String(size).toUpperCase() === normalizedRequestedSize;
      }

      const sizeValue =
        size?.size ||
        size?.name ||
        size?.label ||
        size?.value ||
        "";

      return String(sizeValue).toUpperCase() === normalizedRequestedSize;
    });
  });
}

function productHasColor(product, requestedColor) {
  if (!requestedColor) {
    return true;
  }

  const normalizedRequestedColor = normalizeText(requestedColor);

  return product.variants.some((variant) => {
    const colorName =
      variant?.colorName ||
      variant?.color ||
      variant?.name ||
      "";

    return normalizeText(colorName).includes(normalizedRequestedColor);
  });
}

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
      product.sale.discount ||
      product.sale.percent
    );
  }

  return false;
}

async function getProductByCode(code) {
  if (!code) {
    return null;
  }

  const normalizedCode = String(code).trim().toUpperCase();

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

  let query = db.collection(PRODUCTS_COLLECTION);

  if (category) {
    query = query.where("cat", "==", category);
  }

  if (gender) {
    query = query.where("gender", "==", gender);
  }

  const snapshot = await query.limit(100).get();

  let products = snapshot.docs.map(normalizeProduct);

  products = products.filter((product) => {
    if (!productMatchesText(product, searchText)) {
      return false;
    }

    if (maxPrice !== null && product.price > Number(maxPrice)) {
      return false;
    }

    if (minPrice !== null && product.price < Number(minPrice)) {
      return false;
    }

    if (inStockOnly && product.stock <= 0) {
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
    if (firstProduct.stock > 0 && secondProduct.stock <= 0) {
      return -1;
    }

    if (firstProduct.stock <= 0 && secondProduct.stock > 0) {
      return 1;
    }

    return firstProduct.price - secondProduct.price;
  });

  return products.slice(0, safeLimit);
}

module.exports = {
  getProductByCode,
  searchProducts,
};