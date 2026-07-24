import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";

const contactCollection = collection(db, "contactMessages");

export async function submitContactMessage({ name, email, message }) {
  await addDoc(contactCollection, {
    name: name || "",
    email: email || "",
    message: message || "",
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function getAllContactMessages() {
  const q = query(contactCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function markContactMessageRead(id, read) {
  await updateDoc(doc(db, "contactMessages", id), { read });
}