import { useEffect } from "react";
import { demanderPermissionEtToken, ecouterMessages } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

/**
 * Hook à appeler après le login de l'acheteur (Premium idéalement).
 * Demande la permission + enregistre le token au backend.
 */
export function useFCM() {
  const { utilisateur } = useAuth();

  useEffect(() => {
    if (!utilisateur) return;

    demanderPermissionEtToken();
    ecouterMessages();
  }, [utilisateur?.id]);
}