import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, enableIndexedDbPersistence } from "firebase/firestore";

// Firebase Configuration for Al-Wadi Al-Akhdar Supermarket
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB-al-wadi-green-valley-supermarket-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "alwadi-alakhdar-market.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "alwadi-alakhdar-market",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "alwadi-alakhdar-market.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "617092514858",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:617092514858:web:alwadialakhdar990",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ALWADIGREEN",
};

// Initialize Firebase safely
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.warn("⚠️ Firebase initializeApp fallback:", error);
    app = initializeApp(firebaseConfig, "AL_WADI_APP");
  }
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Try enabling offline Firestore persistence if running in browser
if (typeof window !== "undefined") {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === "failed-precondition") {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn("Firestore persistence warning: Multiple tabs open.");
      } else if (err.code === "unimplemented") {
        // The current browser does not support all of the features required to enable persistence
        console.warn("Firestore persistence warning: Browser unsupported.");
      }
    });
  } catch (e) {
    // Ignore persistence setup failure in non-standard environments
  }
}

export default app;
