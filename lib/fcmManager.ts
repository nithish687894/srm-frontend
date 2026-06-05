/**
 * lib/fcmManager.ts
 * Manages FCM token registration, storage, and refresh.
 * Call registerFCMToken() when user enables push notifications.
 */

import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

const VAPID_KEY =
  "BMT_pjD2AJFJH2ltlgHNWxxmadc_ksXxW_8rxlREpjTLXqPW1cLQNaFfVpX7EI6Zz2sSDAf9Lhxocnh4OSuG7q4";

const TOKEN_KEY = "nexus_fcm_token";

/**
 * Register the Firebase Messaging service worker and get an FCM token.
 * Stores the token in localStorage for use by the notification API.
 * Returns the token string, or null on failure.
 */
export async function registerFCMToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    // Ensure firebase-messaging-sw.js is registered
    const swReg = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn("[FCM] Messaging not supported in this browser.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      console.log("[FCM] Token registered:", token.slice(0, 20) + "...");

      // Sync FCM token to the backend database
      try {
        const authToken = localStorage.getItem("authToken");
        if (authToken) {
          await fetch("/api/notifications/register-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-session-token": authToken,
            },
            body: JSON.stringify({ token }),
          });
          console.log("[FCM] Token successfully synced to backend.");
        }
      } catch (err) {
        console.warn("[FCM] Failed to sync token to backend:", err);
      }

      return token;
    }

    return null;
  } catch (err) {
    console.error("[FCM] Token registration failed:", err);
    return null;
  }
}

/**
 * Get stored FCM token from localStorage.
 */
export function getStoredFCMToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear stored FCM token (on logout / disable alerts).
 */
export function clearFCMToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}
