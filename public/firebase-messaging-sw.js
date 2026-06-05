/**
 * public/firebase-messaging-sw.js
 * Firebase Cloud Messaging Service Worker.
 * This file MUST be at /firebase-messaging-sw.js (root of public dir).
 * It handles background push messages when the app is closed.
 */

// ── Import Firebase compat scripts (required in SW context) ──────────────────
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// ── Initialize Firebase inside SW ────────────────────────────────────────────
firebase.initializeApp({
  apiKey: "AIzaSyC376xkKpiSyZU5MogA-C6vPlP95Up4zvU",
  authDomain: "nexus-d6a2f.firebaseapp.com",
  projectId: "nexus-d6a2f",
  storageBucket: "nexus-d6a2f.firebasestorage.app",
  messagingSenderId: "522019439737",
  appId: "1:522019439737:web:b98a246f05db74533040a8",
  measurementId: "G-97GF2R2X4T",
});

const messaging = firebase.messaging();

// ── Background message handler ───────────────────────────────────────────────
// Fires when app is in the BACKGROUND or CLOSED
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  const title = payload.notification?.title || "SRM Nexus";
  const body  = payload.notification?.body  || "New academic update.";
  const url   = payload.data?.url || "/notifications";

  self.registration.showNotification(title, {
    body,
    icon:   "/nexus-logo.png",
    badge:  "/favicon-32x32.png",
    vibrate: [100, 50, 100],
    data:   { url },
    tag:    payload.data?.tag || "nexus-push",
  });
});

// ── Notification click handler ───────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/notifications";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
