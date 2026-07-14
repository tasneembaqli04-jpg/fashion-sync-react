import { db } from "../../firebase";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";

const FEATURED_DOC = doc(db, "settings", "featuredProduct");

export async function getFeaturedProduct() {
  const snapshot = await getDoc(FEATURED_DOC);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function setFeaturedProduct(product) {
  await setDoc(FEATURED_DOC, { code: product.code, img: product.img });
}

export async function clearFeaturedProduct() {
  await deleteDoc(FEATURED_DOC);
}