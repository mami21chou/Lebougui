import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AuthService } from '../services/authService';
import { UtilisateurService } from '../services/utilisateurService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  //  Helper pour purger TOUT le localStorage d'auth en un seul endroit
  const purgerAuthLocale = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const verifierConnexion = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setChargement(false);
          return;
        }
        const data = await UtilisateurService.getProfil();
        setUtilisateur(data);
      } catch (err) {
        console.error('Erreur lors de la vérification de la connexion:', err);
        purgerAuthLocale();  //  purge complète
        setUtilisateur(null);
      } finally {
        setChargement(false);
      }
    };
    verifierConnexion();
  }, []);

  const deconnecter = useCallback(() => {
    purgerAuthLocale();   // purge complète (access, token, refresh, user)
    setUtilisateur(null);
    setErreur(null);
  }, []);

  const connecter = useCallback(async (identifiant, motDePasse, estAdmin = false) => {
    try {
      setErreur(null);
      setChargement(true);

      let response;
      if (estAdmin) {
        response = await AuthService.connexionAdmin(identifiant, motDePasse);
      } else {
        response = await AuthService.connexionUtilisateur(identifiant, motDePasse);
      }

      if (response.access || response.token) {
        localStorage.setItem('access_token', response.access || response.token);
        if (response.refresh) {
          localStorage.setItem('refresh_token', response.refresh);
        }
        const userData = await UtilisateurService.getProfil();
        setUtilisateur(userData);
        setChargement(false);
        return { success: true, user: userData };
      }

      setChargement(false);
      return { success: false, error: 'Réponse du serveur invalide' };
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.erreur ||
        err.message ||
        'Erreur de connexion';
      setErreur(message);
      setChargement(false);
      return { success: false, error: message };
    }
  }, []);

  const sInscrire = useCallback(async (formData) => {
    try {
      setErreur(null);
      setChargement(true);

      const response = await AuthService.inscription(formData);

      if (response.user) {
        await connecter(formData.telephone, formData.code_pin);
      }

      setChargement(false);
      return { success: true, ...response };
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.erreur ||
        err.message ||
        "Erreur lors de l'inscription";
      setErreur(message);
      setChargement(false);
      return { success: false, error: message };
    }
  }, [connecter]);

  const rafraichirToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        deconnecter();
        return false;
      }

      const response = await fetch(
        `${import.meta.env.VITE_DJANGO_URL || 'http://localhost:8000/api'}/auth/token/refresh/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        }
      );

      if (!response.ok) {
        deconnecter();
        return false;
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      return true;
    } catch (err) {
      console.error('Erreur lors du rafraîchissement du token:', err);
      deconnecter();
      return false;
    }
  }, [deconnecter]);

  const mettreAJourProfil = useCallback(async (donnees) => {
    try {
      setChargement(true);
      const response = await UtilisateurService.mettreAJourProfil(donnees);
      setUtilisateur(response);
      setChargement(false);
      return { success: true, user: response };
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Erreur lors de la mise à jour du profil';
      setErreur(message);
      setChargement(false);
      return { success: false, error: message };
    }
  }, []);

  const souscrirePremium = useCallback(async (typeAbonnement, duree) => {
    try {
      setChargement(true);
      const response = await UtilisateurService.souscrirePremium(typeAbonnement, duree);
      const userData = await UtilisateurService.getProfil();
      setUtilisateur(userData);
      setChargement(false);
      return { success: true, ...response };
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Erreur lors de la souscription Premium';
      setErreur(message);
      setChargement(false);
      return { success: false, error: message };
    }
  }, []);

  const estAuthentifie = useCallback(() => !!utilisateur, [utilisateur]);
  const estPecheur = useCallback(() => utilisateur?.role === 'pecheur', [utilisateur]);
  const estAcheteur = useCallback(() => utilisateur?.role === 'acheteur', [utilisateur]);
  const estLivreur = useCallback(() => utilisateur?.role === 'livreur', [utilisateur]);
  const estAdmin = useCallback(() => utilisateur?.role === 'admin', [utilisateur]);
  const estPremium = useCallback(
    () => utilisateur?.status_premium?.statut === 'actif',
    [utilisateur]
  );

  const valeur = useMemo(
    () => ({
      utilisateur,
      chargement,
      erreur,
      connecter,
      sInscrire,
      deconnecter,
      rafraichirToken,
      mettreAJourProfil,
      souscrirePremium,
      estAuthentifie,
      estPecheur,
      estAcheteur,
      estLivreur,
      estAdmin,
      estPremium,
      setErreur,
    }),
    [
      utilisateur,
      chargement,
      erreur,
      connecter,
      sInscrire,
      deconnecter,
      rafraichirToken,
      mettreAJourProfil,
      souscrirePremium,
      estAuthentifie,
      estPecheur,
      estAcheteur,
      estLivreur,
      estAdmin,
      estPremium,
    ]
  );

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
};

export default AuthContext;