import { db, storage } from "../firebase";
import {
  collection,
  getDocs,
  setDoc,
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