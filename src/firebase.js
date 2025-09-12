// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ Use environment variables instead of hardcoding
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ⚠️ Debug: Check if env vars are loaded
console.log("Firebase Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log("Firebase Config:", firebaseConfig);

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export Firestore, Storage & App
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
