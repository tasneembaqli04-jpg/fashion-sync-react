import { db } from "../../firebase";
import { collection, addDoc, getDocs, orderBy, query, doc, updateDoc } from "firebase/firestore";

const feedbackCollection = collection(db, "feedback");

export async function addFeedback(entry) {
  await addDoc(feedbackCollection, {
    ...entry,
    createdAt: new Date().toISOString(),
    read: false,
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

export async function updateFeedbackReadStatus(id, read) {
  await updateDoc(doc(db, "feedback", id), { read });
}