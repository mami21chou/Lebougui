/* public/firebase-messaging-sw.js */

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"
);

// Configuration Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBPWTrOnx2Fxwd7HwyybHDW2FGsXO43mBg",
  authDomain: "lebugui-notifications.firebaseapp.com",
  projectId: "lebugui-notifications",
  storageBucket: "lebugui-notifications.firebasestorage.app",
  messagingSenderId: "83295224588",
  appId: "1:83295224588:web:659cfc25a9e188f84f3f29",
});

console.log(">>> [SW] Firebase initialisé");

// ---------------------------------------------------------
// INSTALLATION
// ---------------------------------------------------------

self.addEventListener("install", () => {
  console.log(">>> [SW] install");
  self.skipWaiting();
});

// ---------------------------------------------------------
// ACTIVATION
// ---------------------------------------------------------

self.addEventListener("activate", (event) => {
  console.log(">>> [SW] activate");

  event.waitUntil(
    self.clients.claim()
  );
});

// ---------------------------------------------------------
// FIREBASE MESSAGING
// ---------------------------------------------------------

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(">>> [SW] Notification reçue :", payload);

  const notification = payload.notification || {};

  const title = notification.title || "Lebougui";
  const body =
    notification.body || "Nouveau produit disponible";

  self.registration.showNotification(title, {
    body: body,

    icon: "/images/logo-lebougui.jpeg",
    badge: "/images/logo-lebougui.jpeg",

    data: payload.data || {},
  });
});

// ---------------------------------------------------------
// CLIC SUR LA NOTIFICATION
// ---------------------------------------------------------

self.addEventListener("notificationclick", (event) => {
  console.log(">>> [SW] Notification cliquée");

  event.notification.close();

  const url =
    event.notification.data?.url || "/acheteur";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.startsWith(self.location.origin) &&
            "focus" in client
          ) {
            if ("navigate" in client) {
              client.navigate(url);
            }

            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});