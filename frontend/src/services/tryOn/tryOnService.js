import { TRY_ON_ERRORS, tryOnError } from "./tryOnErrors";

const TRY_ON_URL =
  import.meta.env.VITE_TRY_ON_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/tryOn";

export async function requestTryOn({
  product,
  imageUrl,
  signal,
}) {
  if (!product?.code) {
    throw tryOnError(TRY_ON_ERRORS.NO_PRODUCT);
  }

  if (!imageUrl) {
    throw tryOnError(TRY_ON_ERRORS.NO_CUSTOMER_IMAGE);
  }

  const response = await fetch(TRY_ON_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product: {
        code: product.code,
        name: product.name || "",
        img: product.img || "",
        category: product.cat || product.category || "",
        color: product.color || product.colorName || "",
      },
      imageUrl,
    }),
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw tryOnError(
      TRY_ON_ERRORS.REQUEST_FAILED,
      data?.message || data?.error || `Try-On request failed (${response.status})`
    );
  }

  return data;
}