import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
} from "firebase/messaging";
import API from "./api";

// ---------------------------------------------------------
// CONFIGURATION FIREBASE
// ---------------------------------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// ---------------------------------------------------------
// INITIALISATION FIREBASE
// ---------------------------------------------------------
const app = initializeApp(firebaseConfig);
console.log(">>> [FCM] Firebase initialisé");

// ---------------------------------------------------------
// FIREBASE MESSAGING
// ---------------------------------------------------------
let messaging = null;
try {
  messaging = getMessaging(app);
  console.log(">>> [FCM] Firebase Messaging initialisé");
} catch (error) {
  console.warn(">>> [FCM] Firebase Messaging non supporté :", error);
}

// ---------------------------------------------------------
// RÉCUPÉRER LE SERVICE WORKER (scope FCM isolé)
// ---------------------------------------------------------
async function getExistingSWRegistration(timeoutMs = 10000) {
  if (!("serviceWorker" in navigator)) {
    console.error(">>> [FCM] Service Worker non supporté");
    return null;
  }

  console.log(">>> [FCM] Recherche du Service Worker...");
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    //  Cherche le SW avec le scope FCM isolé
    const reg = await navigator.serviceWorker.getRegistration(
      "/firebase-cloud-messaging-push-scope"
    );

    if (reg && reg.active) {
      console.log(">>> [FCM] Service Worker trouvé :", reg.scope);
      console.log(">>> [FCM] Service Worker actif :", reg.active);
      return reg;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.error(">>> [FCM] Aucun Service Worker actif trouvé");
  return null;
}

// ---------------------------------------------------------
// OBTENIR LE TOKEN FCM AVEC RETRY
// ---------------------------------------------------------
async function getTokenWithRetry(
  messaging,
  vapidKey,
  registration,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`>>> [FCM] Tentative token ${i + 1}/${maxRetries}`);

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log(">>> [FCM] Token FCM obtenu");
        return token;
      }
    } catch (error) {
      console.warn(
        `>>> [FCM] Tentative ${i + 1}/${maxRetries} échouée :`,
        error.message
      );

      if (i === maxRetries - 1) throw error;

      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}

// ---------------------------------------------------------
// DEMANDER PERMISSION + OBTENIR TOKEN + ENVOYER AU BACKEND
// ---------------------------------------------------------
export async function demanderPermissionEtToken() {
  if (!messaging) {
    console.warn(">>> [FCM] Messaging non disponible");
    return null;
  }

  try {
    // 1) Permission notification
    const permission = await Notification.requestPermission();
    console.log(">>> [FCM] Permission :", permission);

    if (permission !== "granted") {
      console.warn(">>> [FCM] Permission notifications refusée");
      return null;
    }

    // 2) Service Worker
    const swRegistration = await getExistingSWRegistration();
    if (!swRegistration) {
      console.error(">>> [FCM] Aucun Service Worker trouvé.");
      return null;
    }
    console.log(">>> [FCM] SW prêt :", swRegistration.scope);

    // 3)  PLUS de deleteToken ici :
    // getToken() réutilise le token existant s'il existe déjà.
    // Sinon, il en crée un nouveau.

    // 4) Récupère (ou crée) le token
    const token = await getTokenWithRetry(messaging, VAPID_KEY, swRegistration);
    if (!token) {
      console.warn(">>> [FCM] Aucun token obtenu");
      return null;
    }
    console.log(">>> [FCM] Token obtenu :", token);

    // 5) Envoi au backend (le backend utilise update_or_create)
    await API.post("/fcm/enregistrer/", { token });
    console.log(">>> [FCM] Token enregistré auprès du backend ");

    return token;
  } catch (error) {
    console.error(">>> [FCM] Erreur complète :", error);
    return null;
  }
}

// ---------------------------------------------------------
// ÉCOUTER LES MESSAGES FOREGROUND
// ---------------------------------------------------------
export function ecouterMessages() {
  if (!messaging) {
    console.warn(">>> [FCM] Messaging non disponible");
    return;
  }

  onMessage(messaging, (payload) => {
    console.log(">>> [FCM] Message reçu (foreground) :", payload);

    const { title, body, icon } = payload.notification || {};
    const data = payload.data || {};

    //  Affiche le toast in-app via le contexte global
    if (typeof window.__afficherNotification === 'function') {
      window.__afficherNotification({
        title: title || "Nouvelle notification",
        body: body || "",
        icon: icon || "/images/logo-lebougui.jpeg",
        data: {
          ...data,
          url: data.url || "/acheteur",
        },
      });
    } else {
      // Fallback : notification native
      console.warn(">>> [FCM] Contexte de notification non disponible, fallback natif");
      if (title) {
        new Notification(title, {
          body: body || "",
          icon: "/images/logo-lebougui.jpeg",
        });
      }
    }
  });
}

export { messaging };