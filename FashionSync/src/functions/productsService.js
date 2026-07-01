import { db } from "../firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

const productsCollection = collection(db, "products");

export async function getProducts() {
  const snapshot = await getDocs(productsCollection);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}
export async function addProduct(product) {
  await setDoc(doc(db, "products", product.code), product);
}
export async function deleteProduct(code) {
  await deleteDoc(doc(db, "products", code));
}