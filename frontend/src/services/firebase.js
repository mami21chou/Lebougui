import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import API from "./api";

// ═══ Config lue depuis .env.local (Vite) ═══
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const app = initializeApp(firebaseConfig);

// ═══ Messaging (attention : non supporté sur Safari iOS ancien) ═══
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn("FCM non supporté sur ce navigateur :", err);
}

// ═══ Demande la permission + récupère le token + l'envoie au backend ═══
export async function demanderPermissionEtToken() {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Permission notifications refusée");
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) {
      console.warn("Aucun token FCM obtenu");
      return null;
    }

    await API.post("/fcm/enregistrer/", { token });
    console.log(">>> [FCM] Token enregistré");
    return token;
  } catch (err) {
    console.error("Erreur FCM :", err);
    return null;
  }
}

// ═══ Écoute les notifications reçues (app au premier plan) ═══
export function ecouterMessages() {
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    console.log(">>> [FCM] Message reçu :", payload);
  });
}

export { messaging };