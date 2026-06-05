/**
 * lib/firebase.ts
 * Client-side Firebase app + FCM initialization.
 * These keys are safe to be public (restricted by Firebase authorized domains).
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: "AIzaSyC376xkKpiSyZU5MogA-C6vPlP95Up4zvU",
  authDomain: "nexus-d6a2f.firebaseapp.com",
  projectId: "nexus-d6a2f",
  storageBucket: "nexus-d6a2f.firebasestorage.app",
  messagingSenderId: "522019439737",
  appId: "1:522019439737:web:b98a246f05db74533040a8",
  measurementId: "G-97GF2R2X4T",
};

// Initialize Firebase app (singleton)
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Get Firebase Messaging instance.
 * Returns null if the browser doesn't support it (e.g., Safari without SW).
 */
export async function getFirebaseMessaging() {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(firebaseApp);
  } catch {
    return null;
  }
}
