export function getVariantTotal(variant) {
  return Object.values(variant?.sizes || {}).reduce(
    (sum, qty) => sum + (parseInt(qty, 10) || 0),
    0
  );
}

export function getProductStockFromVariants(variants) {
  return (variants || []).reduce(
    (sum, variant) => sum + getVariantTotal(variant),
    0
  );
}

export function sanitizeQtyInput(value) {
  const cleanValue = String(value ?? "").replace(/[^0-9]/g, "");
  return cleanValue === "" ? 0 : parseInt(cleanValue, 10);
}

export function cloneVariants(variants) {
  return (variants || []).map((variant) => ({
    ...variant,
    sizes: { ...(variant?.sizes || {}) },
  }));
}
