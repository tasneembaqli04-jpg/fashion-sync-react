import { db } from "../../firebase";
import { collection, addDoc, getDocs, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { translateText } from "../translation/translationService";
import { omitEmpty } from "../translation/omitEmpty";

const feedbackCollection = collection(db, "feedback");

export async function addFeedback(entry) {
  const textEn = entry.text ? await translateText(entry.text) : "";

  await addDoc(
    feedbackCollection,
    omitEmpty({
      ...entry,
      textEn: textEn || entry.text || "",
      createdAt: new Date().toISOString(),
      read: false,
    })
  );
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

export async function updateFeedbackTranslation(id, textEn) {
  await updateDoc(doc(db, "feedback", id), omitEmpty({ textEn }));
}