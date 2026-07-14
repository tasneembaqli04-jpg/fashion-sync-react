import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHp13Aaycgle5W4EDIN0t4vA_9c1rDk4M",
  authDomain: "fashionsync-dc79f.firebaseapp.com",
  projectId: "fashionsync-dc79f",
  storageBucket: "fashionsync-dc79f.firebasestorage.app",
  messagingSenderId: "881630868238",
  appId: "1:881630868238:web:34272b226598393aae9d5f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;