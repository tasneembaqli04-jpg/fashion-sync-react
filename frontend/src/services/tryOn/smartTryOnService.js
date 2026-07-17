import { requestTryOn } from "./tryOnService";
import { requestTryOnV2 } from "./tryOnV2Service";

const VIRTUAL_TRY_ON_CATEGORIES = [
  "שמלה",
  "שמלות",
  "חולצה",
  "חולצות",
  "מכנס",
  "מכנסיים",
  "חצאית",
  "חצאיות",
  "מעיל",
  "מעילים",
  "זקט",
  "זקטים",
  "ז'קט",
  "ז'קטים",
  "גקט",
  "גקטים",
  "ג'קט",
  "ג'קטים",
  "נעל",
  "נעליים",
  "נעלי נשים",
  "נעלי גברים",
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
    product?.category ||
    product?.type ||
    ""
  );

  const productName = normalizeText(product?.name);

  return VIRTUAL_TRY_ON_CATEGORIES.some((allowedCategory) => {
    const normalizedAllowed = normalizeText(allowedCategory);

    return (
      productCategory.includes(normalizedAllowed) ||
      productName.includes(normalizedAllowed)
    );
  });
}

export function requestSmartTryOn({
  product,
  imageUrl,
  signal,
}) {
  const useV2 = shouldUseVirtualTryOn(product);

  console.log("Smart Try-On routing:", {
    code: product?.code,
    name: product?.name,
    category: product?.cat || product?.category,
    selectedMechanism: useV2 ? "tryOnV2" : "tryOn",
  });

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