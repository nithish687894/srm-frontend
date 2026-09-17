importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

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

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  self.registration.showNotification(notification.title || "SRM Nexus", {
    body: notification.body || "",
    icon: "/nexus-logo.png",
    badge: "/favicon-32x32.png",
    data: payload.data || {},
  });
});
