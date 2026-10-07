/* public/firebase-messaging-sw.js */

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");
importScripts("/firebase-config.js");

// Init Firebase avec la config passée par firebase-config.js
firebase.initializeApp(self.FIREBASE_CONFIG);
const messaging = firebase.messaging();

// Notification reçue en arrière-plan (onglet fermé / minimisé)
messaging.onBackgroundMessage((payload) => {
  console.log(">>> [SW] Notification en arrière-plan :", payload);

  const { title, body } = payload.notification || {};
  const icon = payload.data?.icon || "/images/logo-lebougui.jpeg";

  self.registration.showNotification(title || "Lebougui", {
    body: body || "Nouveau produit disponible !",
    icon,
    badge: icon,
    data: payload.data,
  });
});

// Clic sur la notification → ouvre l'app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/acheteur/accueil"));
});