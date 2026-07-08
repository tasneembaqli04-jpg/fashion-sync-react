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
    const currentStock = Number(data.stock) || 0;
    const currentSales = Number(data.salesLastMonth) || 0;
    const qty = Number(item.qty) || 0;
    const newStock = Math.max(0, currentStock - qty);

    await updateDoc(productRef, {
      stock: newStock,
      salesLastMonth: currentSales + qty,
    });
  }
}