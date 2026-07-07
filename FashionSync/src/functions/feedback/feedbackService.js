import { db } from "../../backend/firebase";
import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";

const feedbackCollection = collection(db, "feedback");

export async function addFeedback(entry) {
  await addDoc(feedbackCollection, {
    ...entry,
    createdAt: new Date().toISOString(),
  });
}

export async function getAllFeedback() {
  const q = query(feedbackCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}