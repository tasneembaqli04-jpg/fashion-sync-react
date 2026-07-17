const TRY_ON_V2_URL =
  import.meta.env.VITE_TRY_ON_V2_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/tryOnV2";

export async function requestTryOnV2({
  product,
  imageUrl,
  signal,
}) {
  if (!product?.code) {
    throw new Error("לא נבחר מוצר");
  }

  if (!product?.img) {
    throw new Error("חסרה תמונת מוצר");
  }

  if (!imageUrl) {
    throw new Error("לא הועלתה תמונה");
  }

  const response = await fetch(TRY_ON_V2_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product: {
        code: product.code,
        name: product.name || "",
        img: product.img,
        category: product.cat || product.category || "",
        color: product.color || product.colorName || "",
      },
      imageUrl,
    }),
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        "בקשת Virtual Try-On נכשלה"
    );
  }

  return data;
}