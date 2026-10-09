import { useEffect } from "react";
import { demanderPermissionEtToken, ecouterMessages } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

//  Flag global au module : survit aux remontages StrictMode
let fcmInitialized = false;

export function useFCM() {
  const { utilisateur } = useAuth();

  useEffect(() => {
    if (!utilisateur) return;
    if (fcmInitialized) return;
    if (!("serviceWorker" in navigator)) return;

    fcmInitialized = true;

    const init = async () => {
      try {
        console.log(">>> [useFCM] Initialisation FCM...");

        const token = await demanderPermissionEtToken();

        if (token) {
          console.log(">>> [useFCM] FCM initialisé avec succès");
          ecouterMessages();
        } else {
          console.warn(">>> [useFCM] Aucun token FCM");
          // Autorise une nouvelle tentative au prochain login
          fcmInitialized = false;
        }
      } catch (err) {
        console.error(">>> [useFCM] Erreur :", err);
        fcmInitialized = false;
      }
    };

    init();
  }, [utilisateur?.id]);
}