/**
 * hooks/usePushNotifications.ts
 * Capacitor-native push notifications for Android/iOS.
 * On web, falls back to the existing Firebase JS SDK via fcmManager.
 *
 * Automatically:
 *  1. Requests permission on mount (if logged in).
 *  2. Registers with FCM and sends the token to the Srm-Nexus backend.
 *  3. Listens for foreground notifications and logs them.
 */

"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store";

const TOKEN_KEY = "nexus_fcm_token";

/**
 * Detect whether the app is running inside a Capacitor native shell.
 * The Capacitor runtime injects `window.Capacitor` on native platforms.
 */
function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  return cap?.isNativePlatform?.() ?? false;
}

export default function usePushNotifications() {
  const authToken = useAuthStore((s) => s.authToken);
  const registered = useRef(false);

  useEffect(() => {
    // Only run once, only when logged in, only on native
    if (!authToken || registered.current || !isNative()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        // Dynamically import so the web build never bundles native code
        const { PushNotifications } = await import(
          "@capacitor/push-notifications"
        );

        // ── 1. Check / request permission ────────────────────────────
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== "granted") {
          console.warn("[Push] Permission not granted:", permStatus.receive);
          return;
        }

        // ── 2. Register with FCM ─────────────────────────────────────
        await PushNotifications.register();

        // ── 3. Listen for the FCM token ──────────────────────────────
        const tokenListener = await PushNotifications.addListener(
          "registration",
          async (tokenData) => {
            const fcmToken = tokenData.value;
            console.log(
              "[Push] FCM token:",
              fcmToken.slice(0, 20) + "..."
            );

            // Persist locally
            try {
              localStorage.setItem(TOKEN_KEY, fcmToken);
            } catch {}

            // Sync to backend
            try {
              await fetch("/api/notifications/register-token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-session-token": authToken!,
                },
                body: JSON.stringify({ token: fcmToken }),
              });
              console.log("[Push] Token synced to backend.");
            } catch (err) {
              console.warn("[Push] Backend sync failed:", err);
            }
          }
        );

        // ── 4. Handle registration errors ────────────────────────────
        const errorListener = await PushNotifications.addListener(
          "registrationError",
          (err) => {
            console.error("[Push] Registration error:", err);
          }
        );

        // ── 5. Handle foreground notifications ───────────────────────
        const foregroundListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("[Push] Foreground notification:", notification);
            // The notification is already displayed by the system on Android;
            // you can optionally show a custom in-app toast here.
          }
        );

        // ── 6. Handle notification tap (opens app) ───────────────────
        const tapListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            console.log("[Push] Notification tapped:", action);
            const url = action.notification?.data?.url;
            if (url && typeof window !== "undefined") {
              window.location.href = url;
            }
          }
        );

        registered.current = true;

        cleanup = () => {
          tokenListener.remove();
          errorListener.remove();
          foregroundListener.remove();
          tapListener.remove();
        };
      } catch (err) {
        console.warn("[Push] Setup failed (likely not native):", err);
      }
    })();

    return () => cleanup?.();
  }, [authToken]);
}
