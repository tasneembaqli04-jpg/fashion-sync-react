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
import { translateText, keepPersonName } from "../translation/translationService";
import { omitEmpty } from "../translation/omitEmpty";

const contactCollection = collection(db, "contactMessages");

export async function submitContactMessage({ name, email, message }) {
  // The sender is a person; only the message body is translated.
  const nameEn = keepPersonName(name);
  const messageEn = await translateText(message || "");

  await addDoc(
    contactCollection,
    omitEmpty({
      name: name || "",
      nameEn: nameEn || name || "",
      email: email || "",
      message: message || "",
      messageEn: messageEn || message || "",
      read: false,
      createdAt: new Date().toISOString(),
    })
  );
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

export async function updateContactMessageTranslation(id, { nameEn, messageEn }) {
  await updateDoc(doc(db, "contactMessages", id), omitEmpty({ nameEn, messageEn }));
}

/**
 * Records the reply the manager sent, and marks the enquiry read.
 *
 * Called only after the email has gone. An answered enquiry has by definition
 * been read, so marking it here saves the manager doing separately what
 * answering already proved.
 *
 * @param {string} id - Enquiry document id.
 * @param {string} replyText - What was sent.
 * @returns {Promise<void>}
 */
export async function saveContactReply(id, replyText) {
  await updateDoc(doc(db, "contactMessages", id), {
    replyText,
    repliedAt: new Date().toISOString(),
    read: true,
  });
}