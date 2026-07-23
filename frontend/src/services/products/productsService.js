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

    const productRef = doc(db, "products", item.code);
    const snapshot = await getDoc(productRef);

    if (!snapshot.exists()) continue;

    const data = snapshot.data();
    const currentSales = Number(data.salesLastMonth) || 0;
    const qty = Number(item.qty) || 0;
    const hasVariants = Array.isArray(data.variants) && data.variants.length > 0;

    if (hasVariants) {
      const variants = data.variants.map((variant) => ({
        colorName: variant.colorName,
        sizes: { ...(variant.sizes || {}) },
      }));

      const variantIndex = variants.findIndex(
        (variant) => variant.colorName === item.color
      );

      if (variantIndex !== -1) {
        const sizesInColor = variants[variantIndex].sizes || {};

        if (item.size && sizesInColor[item.size] !== undefined) {
          const currentSizeQty = Number(sizesInColor[item.size]) || 0;
          variants[variantIndex].sizes[item.size] = Math.max(
            0,
            currentSizeQty - qty
          );
        } else {
          let remaining = qty;

          for (const sizeKey of Object.keys(sizesInColor)) {
            if (remaining <= 0) break;

            const current = Number(sizesInColor[sizeKey]) || 0;
            const deduct = Math.min(current, remaining);

            variants[variantIndex].sizes[sizeKey] = current - deduct;
            remaining -= deduct;
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
        salesLastMonth: currentSales + qty,
      });
    } else {
      const currentStock = Number(data.stock) || 0;
      const newStock = Math.max(0, currentStock - qty);

      await updateDoc(productRef, {
        stock: newStock,
        salesLastMonth: currentSales + qty,
      });
    }
  }
}
export async function restockReturnedItem({ code, qty, color, size }) {
  if (!code) return;

  const productRef = doc(db, "products", code);
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) return;

  const data = snapshot.data();
  const addQty = Number(qty) || 0;
  const hasVariants = Array.isArray(data.variants) && data.variants.length > 0;

  if (hasVariants) {
    const variants = data.variants.map((variant) => ({
      colorName: variant.colorName,
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
    });
  } else {
    const currentStock = Number(data.stock) || 0;

    await updateDoc(productRef, {
      stock: currentStock + addQty,
    });
  }
}