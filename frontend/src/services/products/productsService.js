import { db, storage } from "../../firebase";
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const productsCollection = collection(db, "products");

async function uploadProductImage(code, dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const imageRef = ref(storage, `products/${code}-${Date.now()}.jpg`);
  await uploadBytes(imageRef, blob);
  return await getDownloadURL(imageRef);
}

export async function getProducts() {
  const snapshot = await getDocs(productsCollection);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}
export async function addProduct(product) {
  const existing = await getDoc(doc(db, "products", product.code));

  if (existing.exists()) {
    throw new Error(`מוצר עם הקוד ${product.code} כבר קיים`);
  }

  let imageUrl = product.img;

  if (imageUrl && imageUrl.startsWith("data:")) {
    imageUrl = await uploadProductImage(product.code, imageUrl);
  }

  await setDoc(doc(db, "products", product.code), { ...product, img: imageUrl });
}
export async function deleteProduct(code) {
  await deleteDoc(doc(db, "products", code));
}
export async function updateProduct(product) {
  let imageUrl = product.img;

  if (imageUrl && imageUrl.startsWith("data:")) {
    imageUrl = await uploadProductImage(product.code, imageUrl);
  }

  await setDoc(doc(db, "products", product.code), { ...product, img: imageUrl });
}
export async function decrementProductsStock(cartItems = []) {
  for (const item of cartItems) {
    if (item.isGiftCard || !item.code) continue;

    // Each item is handled independently: a failure on one product is
    // logged and the loop continues, so the remaining items still get
    // their stock decremented. Mirrors restockOrderItems.
    try {
      const productRef = doc(db, "products", item.code);
      const snapshot = await getDoc(productRef);

      if (!snapshot.exists()) continue;

      const data = snapshot.data();
      const currentSales = Number(data.salesLastMonth) || 0;
      const qty = Number(item.qty) || 0;
      const hasVariants = Array.isArray(data.variants) && data.variants.length > 0;

      if (hasVariants) {
        // Clone variants while preserving every existing field. Rebuilding a
        // variant from a fixed set of keys would drop the rest, such as
        // colorNameEn, on every write back to Firestore. The nested spread on
        // sizes keeps the update below from mutating the original snapshot.
        const variants = data.variants.map((variant) => ({
          ...variant,
          sizes: { ...(variant.sizes || {}) },
        }));

        const variantIndex = variants.findIndex(
          (variant) => variant.colorName === item.color
        );

        // Tracked separately from qty. When the requested quantity exceeds the
        // stock actually held for that colour, the surplus cannot be taken off
        // the shelf, so it must not be counted as a sale either.
        let deductedQty = 0;

        if (variantIndex !== -1) {
          const sizesInColor = variants[variantIndex].sizes || {};

          if (item.size && sizesInColor[item.size] !== undefined) {
            const currentSizeQty = Number(sizesInColor[item.size]) || 0;
            const deduct = Math.min(currentSizeQty, qty);

            variants[variantIndex].sizes[item.size] = currentSizeQty - deduct;
            deductedQty = deduct;
          } else {
            let remaining = qty;

            for (const sizeKey of Object.keys(sizesInColor)) {
              if (remaining <= 0) break;

              const current = Number(sizesInColor[sizeKey]) || 0;
              const deduct = Math.min(current, remaining);

              variants[variantIndex].sizes[sizeKey] = current - deduct;
              remaining -= deduct;
              deductedQty += deduct;
            }
          }
        }

        const newStock = variants.reduce(
          (sum, variant) =>
            sum +
            Object.values(variant.sizes || {}).reduce(
              (innerSum, sizeQty) => innerSum + (Number(sizeQty) || 0),
              0
            ),
          0
        );

        await updateDoc(productRef, {
          stock: newStock,
          variants,
          salesLastMonth: currentSales + deductedQty,
        });
      } else {
        const currentStock = Number(data.stock) || 0;
        // The same rule as the variant path: only stock that came off the
        // shelf counts as sold.
        const deductedQty = Math.min(currentStock, qty);
        const newStock = currentStock - deductedQty;

        await updateDoc(productRef, {
          stock: newStock,
          salesLastMonth: currentSales + deductedQty,
        });
      }
    } catch (err) {
      console.error("Stock decrement failed for item", item.code, err);
    }
  }
}
/**
 * The sales count after goods have gone back on the shelf.
 *
 * A cancelled order was never a sale, and a returned item stopped being one,
 * so both give their units back to the count as well as to the stock.
 * Without this the count only ever rose, and a product bought once and
 * cancelled stayed recorded as sold for good.
 *
 * Floored at zero. The count and the stock are written by separate paths and
 * can drift — a manager editing stock by hand does not touch the count — and
 * a negative sales figure would be a worse answer than an imprecise one.
 *
 * @param {number} currentSales - The count before the restock.
 * @param {number} restoredQty - Units that actually returned to the shelf.
 * @returns {number} The count to store, never below zero.
 */
export function salesAfterRestock(currentSales, restoredQty) {
  return Math.max(0, (Number(currentSales) || 0) - (Number(restoredQty) || 0));
}

export async function restockReturnedItem({ code, qty, color, size }) {
  if (!code) return;

  const productRef = doc(db, "products", code);
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) return;

  const data = snapshot.data();
  const addQty = Number(qty) || 0;
  const hasVariants = Array.isArray(data.variants) && data.variants.length > 0;

  // Read before anything is written, so the units that actually reached the
  // shelf can be measured rather than assumed. The variant path can restock
  // nothing at all — when the colour no longer exists on the product — and a
  // sale must not be unwound for goods that never came back.
  const previousStock = Number(data.stock) || 0;
  const currentSales = Number(data.salesLastMonth) || 0;

  if (hasVariants) {
    // Clone variants while preserving every existing field, for the same
    // reason as in decrementProductsStock: a partial rebuild would erase
    // fields such as colorNameEn on every restock.
    const variants = data.variants.map((variant) => ({
      ...variant,
      sizes: { ...(variant.sizes || {}) },
    }));

    const variantIndex = variants.findIndex(
      (variant) => variant.colorName === color
    );

    if (variantIndex !== -1) {
      const sizesInColor = variants[variantIndex].sizes || {};

      if (size && sizesInColor[size] !== undefined) {
        const currentSizeQty = Number(sizesInColor[size]) || 0;
        variants[variantIndex].sizes[size] = currentSizeQty + addQty;
      } else {
        const firstSizeKey = Object.keys(sizesInColor)[0];
        if (firstSizeKey) {
          const currentSizeQty = Number(sizesInColor[firstSizeKey]) || 0;
          variants[variantIndex].sizes[firstSizeKey] = currentSizeQty + addQty;
        }
      }
    }

    const newStock = variants.reduce(
      (sum, variant) =>
        sum +
        Object.values(variant.sizes || {}).reduce(
          (innerSum, sizeQty) => innerSum + (Number(sizeQty) || 0),
          0
        ),
      0
    );

    await updateDoc(productRef, {
      stock: newStock,
      variants,
      salesLastMonth: salesAfterRestock(currentSales, newStock - previousStock),
    });
  } else {
    const currentStock = Number(data.stock) || 0;

    await updateDoc(productRef, {
      stock: currentStock + addQty,
      salesLastMonth: salesAfterRestock(currentSales, addQty),
    });
  }
}
export async function restockOrderItems(items = []) {
  for (const item of items) {
    if (item.isGiftCard || !item.code) continue;

    try {
      await restockReturnedItem({
        code: item.code,
        qty: item.qty,
        color: item.color,
        size: item.size,
      });
    } catch (err) {
      console.error("Restock failed for item", item.code, err);
    }
  }
}