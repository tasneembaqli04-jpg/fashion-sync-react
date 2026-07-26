import { db } from "../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { translateText } from "../translation/translationService";
import { omitEmpty } from "../translation/omitEmpty";

const STORE_DOC = doc(db, "settings", "storeDetails");

export async function getStoreDetails() {
  const snapshot = await getDoc(STORE_DOC);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function setStoreDetails(values) {
  await setDoc(
    STORE_DOC,
    omitEmpty({
      storeName: values.storeName || "",
      phone: values.phone || "",
      email: values.email || "",
      address: values.address || "",
      addressEn: values.addressEn || "",
    })
  );
}

export async function translateStoreAddress(address) {
  return await translateText(address || "");
}