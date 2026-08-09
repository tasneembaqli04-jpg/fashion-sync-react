import { requestTryOn } from "./tryOnService";
import { requestTryOnV2 } from "./tryOnV2Service";

const VIRTUAL_TRY_ON_CATEGORIES = [
  "חולצות",
  "מכנסיים",
  "שמלות",
  "עליוניות",
  "נעליים",
];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[׳’]/g, "'");
}

function shouldUseVirtualTryOn(product) {
  const productCategory = normalizeText(
    product?.cat ||
    ""
  );

  return VIRTUAL_TRY_ON_CATEGORIES.some(
    (allowedCategory) =>
      productCategory === normalizeText(allowedCategory)
  );
}

export function requestSmartTryOn({
  product,
  imageUrl,
  signal,
}) {
  const useV2 = shouldUseVirtualTryOn(product);

  if (useV2) {
    return requestTryOnV2({
      product,
      imageUrl,
      signal,
    });
  }

  return requestTryOn({
    product,
    imageUrl,
    signal,
  });
}