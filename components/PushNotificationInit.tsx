"use client";

import usePushNotifications from "@/hooks/usePushNotifications";

/**
 * Invisible component that initializes native push notifications
 * when running inside Capacitor (Android/iOS).
 * Mount once in the app tree (e.g. inside Providers).
 */
export default function PushNotificationInit() {
  usePushNotifications();
  return null;
}
