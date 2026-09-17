import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { CommandeService } from '../services/commandeService';
import { useAuth } from './AuthContext';

const CommandeContext = createContext(null);

export const useCommandes = () => {
  const context = useContext(CommandeContext);
  if (!context) {
    throw new Error('useCommandes doit être utilisé dans un CommandeProvider');
  }
  return context;
};

export const CommandeProvider = ({ children }) => {
  const { utilisateur, estAcheteur, estPecheur, estLivreur, estAuthentifie } = useAuth();

  const [commandes, setCommandes] = useState({
    liste: [],
    chargement: false,
    erreur: null,
  });

  const [mesCommandes, setMesCommandes] = useState({
    liste: [],
    chargement: false,
    erreur: null,
  });

  const [alertes, setAlertes] = useState({
    liste: [],
    chargement: false,
    erreur: null,
  });

  const [livraisons, setLivraisons] = useState({
    liste: [],
    chargement: false,
    erreur: null,
  });

  const chargerMesCommandes = useCallback(async () => {
    if (!utilisateur) return;

    try {
      setMesCommandes((prev) => ({ ...prev, chargement: true, erreur: null }));

      let response;
      if (estAcheteur()) {
        response = await CommandeService.listerMesCommandes();
      } else if (estPecheur()) {
        response = await CommandeService.listerCommandesPecheur();
      } else if (estLivreur()) {
        response = await CommandeService.listerCommandesLivreur();
      } else {
        response = await CommandeService.listerCommandes();
      }

      setMesCommandes({
        liste: response || [],
        chargement: false,
        erreur: null,
      });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Erreur lors du chargement des commandes';
      setMesCommandes((prev) => ({ ...prev, chargement: false, erreur: message }));
    }
  }, [utilisateur, estAcheteur, estPecheur, estLivreur]);

  const chargerAlertes = useCallback(async () => {
    if (!utilisateur || !estAcheteur()) return;

    try {
      setAlertes((prev) => ({ ...prev, chargement: true, erreur: null }));
      const response = await CommandeService.listerMesAlertes();
      setAlertes({
        liste: response || [],
        chargement: false,
        erreur: null,
      });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Erreur lors du chargement des alertes';
      setAlertes((prev) => ({ ...prev, chargement: false, erreur: message }));
    }
  }, [utilisateur, estAcheteur]);

  const chargerLivraisons = useCallback(async () => {
    if (!utilisateur || !estLivreur()) return;

    try {
      setLivraisons((prev) => ({ ...prev, chargement: true, erreur: null }));
      const response = await CommandeService.listerMesLivraisons();
      setLivraisons({
        liste: response || [],
        chargement: false,
        erreur: null,
      });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Erreur lors du chargement des livraisons';
      setLivraisons((prev) => ({ ...prev, chargement: false, erreur: message }));
    }
  }, [utilisateur, estLivreur]);

  // Un seul useEffect qui centralise les chargements — évite les boucles
  useEffect(() => {
    if (!utilisateur) return;
    chargerMesCommandes();
  }, [utilisateur, chargerMesCommandes]);

  useEffect(() => {
    if (!utilisateur || !estAcheteur()) return;
    chargerAlertes();
  }, [utilisateur, estAcheteur, chargerAlertes]);

  useEffect(() => {
    if (!utilisateur || !estLivreur()) return;
    chargerLivraisons();
  }, [utilisateur, estLivreur, chargerLivraisons]);

  const creerAlerte = useCallback(
    async (nomPoisson, quantiteMin = null, prixMax = null) => {
      if (!estAcheteur()) {
        return { success: false, error: 'Seul un acheteur peut créer une alerte' };
      }
      try {
        const response = await CommandeService.creerAlerte(nomPoisson, quantiteMin, prixMax);
        await chargerAlertes();
        return { success: true, data: response };
      } catch (err) {
        const message =
          err.response?.data?.detail || err.message || "Erreur lors de la création de l'alerte";
        return { success: false, error: message };
      }
    },
    [estAcheteur, chargerAlertes]
  );

  const desactiverAlerte = useCallback(
    async (id) => {
      try {
        await CommandeService.desactiverAlerte(id);
        await chargerAlertes();
        return { success: true };
      } catch (err) {
        const message =
          err.response?.data?.detail || err.message || "Erreur lors de la désactivation";
        return { success: false, error: message };
      }
    },
    [chargerAlertes]
  );

  const supprimerAlerte = useCallback(
    async (id) => {
      try {
        await CommandeService.supprimerAlerte(id);
        await chargerAlertes();
        return { success: true };
      } catch (err) {
        const message =
          err.response?.data?.detail || err.message || "Erreur lors de la suppression";
        return { success: false, error: message };
      }
    },
    [chargerAlertes]
  );

  const passerCommande = useCallback(
    async (produitId, quantite) => {
      if (!estAcheteur()) {
        return { success: false, error: 'Seul un acheteur peut passer une commande' };
      }
      try {
        const response = await CommandeService.creerCommande(produitId, quantite);
        await chargerMesCommandes();
        return { success: true, data: response };
      } catch (err) {
        const message =
          err.response?.data?.detail || err.message || 'Erreur lors de la création de la commande';
        return { success: false, error: message };
      }
    },
    [estAcheteur, chargerMesCommandes]
  );

  const mettreAJourStatutCommande = useCallback(
    async (commandeId, statut) => {
      try {
        const response = await CommandeService.mettreAJourStatutCommande(commandeId, statut);
        await chargerMesCommandes();
        return { success: true, data: response };
      } catch (err) {
        const message =
          err.response?.data?.detail || err.message || 'Erreur lors de la mise à jour du statut';
        return { success: false, error: message };
      }
    },
    [chargerMesCommandes]
  );

  const accepterLivraison = useCallback(
    async (livraisonId) => {
      try {
        await CommandeService.mettreAJourStatutLivraison(livraisonId, 'en_cours');
        await chargerLivraisons();
        return { success: true };
      } catch (err) {
        const message =
          err.response?.data?.detail || err.message || "Erreur lors de l'acceptation";
        return { success: false, error: message };
      }
    },
    [chargerLivraisons]
  );

  const terminerLivraison = useCallback(
    async (livraisonId) => {
      try {
        await CommandeService.mettreAJourStatutLivraison(livraisonId, 'terminee');
        await chargerLivraisons();
        await chargerMesCommandes();
        return { success: true };
      } catch (err) {
        const message =
          err.response?.data?.detail || err.message || 'Erreur lors de la finalisation';
        return { success: false, error: message };
      }
    },
    [chargerLivraisons, chargerMesCommandes]
  );

  const noterLivreur = useCallback(
    async (livraisonId, note, commentaire = '') => {
      if (!estAcheteur()) {
        return { success: false, error: 'Seul un acheteur peut noter une livraison' };
      }
      try {
        const response = await CommandeService.noterLivreur(livraisonId, note, commentaire);
        return { success: true, data: response };
      } catch (err) {
        const message = err.response?.data?.detail || err.message || 'Erreur lors de la notation';
        return { success: false, error: message };
      }
    },
    [estAcheteur]
  );

  const filtrerCommandesParStatut = useCallback(
    (statut) => {
      if (!statut) return mesCommandes.liste;
      return mesCommandes.liste.filter(
        (c) => c.statut?.toLowerCase() === statut.toLowerCase()
      );
    },
    [mesCommandes.liste]
  );

  const filtrerAlertesParStatut = useCallback(
    (statut) => {
      if (!statut) return alertes.liste;
      return alertes.liste.filter((a) => a.statut?.toLowerCase() === statut.toLowerCase());
    },
    [alertes.liste]
  );

  const filtrerLivraisonsParStatut = useCallback(
    (statut) => {
      if (!statut) return livraisons.liste;
      return livraisons.liste.filter((l) => l.statut?.toLowerCase() === statut.toLowerCase());
    },
    [livraisons.liste]
  );

  const getCommandesEnAttente = useCallback(
    () => mesCommandes.liste.filter((c) => c.statut === 'en_attente'),
    [mesCommandes.liste]
  );
  const getCommandesEnCours = useCallback(
    () => mesCommandes.liste.filter((c) => c.statut === 'en_cours'),
    [mesCommandes.liste]
  );
  const getCommandesTerminees = useCallback(
    () => mesCommandes.liste.filter((c) => c.statut === 'terminee'),
    [mesCommandes.liste]
  );

  const getVentesTotal = useCallback(() => {
    if (!estPecheur()) return 0;
    return mesCommandes.liste
      .filter((c) => c.statut === 'terminee')
      .reduce((total, cmd) => {
        const montant = (cmd.produit?.prix || 0) * (cmd.quantite || 0);
        return total + montant;
      }, 0);
  }, [estPecheur, mesCommandes.liste]);

  const getStatistiquesPêcheur = useCallback(() => {
    if (!estPecheur()) {
      return {
        totalCommandes: 0,
        commandesEnAttente: 0,
        commandesEnCours: 0,
        commandesTerminees: 0,
        ventesTotal: 0,
        produitsVendus: 0,
      };
    }
    const terminees = getCommandesTerminees();
    const totalVentes = getVentesTotal();
    return {
      totalCommandes: mesCommandes.liste.length,
      commandesEnAttente: getCommandesEnAttente().length,
      commandesEnCours: getCommandesEnCours().length,
      commandesTerminees: terminees.length,
      ventesTotal: totalVentes,
      produitsVendus: terminees.reduce((sum, cmd) => sum + (cmd.quantite || 0), 0),
    };
  }, [
    estPecheur,
    mesCommandes.liste,
    getCommandesTerminees,
    getVentesTotal,
    getCommandesEnAttente,
    getCommandesEnCours,
  ]);

  const getStatistiquesAcheteur = useCallback(() => {
    if (!estAcheteur()) {
      return {
        totalCommandes: 0,
        commandesEnAttente: 0,
        commandesEnCours: 0,
        commandesTerminees: 0,
        totalDepense: 0,
      };
    }
    const totalDepense = mesCommandes.liste
      .filter((c) => c.statut === 'terminee')
      .reduce((total, cmd) => {
        const montant = (cmd.produit?.prix || 0) * (cmd.quantite || 0);
        return total + montant;
      }, 0);
    return {
      totalCommandes: mesCommandes.liste.length,
      commandesEnAttente: getCommandesEnAttente().length,
      commandesEnCours: getCommandesEnCours().length,
      commandesTerminees: getCommandesTerminees().length,
      totalDepense,
    };
  }, [
    estAcheteur,
    mesCommandes.liste,
    getCommandesTerminees,
    getCommandesEnAttente,
    getCommandesEnCours,
  ]);

  const validerCommande = useCallback((produit, quantite) => {
    const erreurs = {};
    if (!produit || !produit.id) erreurs.produit = 'Le produit est obligatoire';
    if (quantite === undefined || quantite === null || isNaN(quantite) || quantite <= 0)
      erreurs.quantite = 'La quantité doit être un nombre positif';
    if (produit && quantite > (produit.quantite || 0))
      erreurs.quantite = `Quantité disponible: ${produit.quantite || 0}`;
    return { valide: Object.keys(erreurs).length === 0, erreurs };
  }, []);

  const validerAlerte = useCallback((nomPoisson, quantiteMin, prixMax) => {
    const erreurs = {};
    if (!nomPoisson || nomPoisson.trim() === '')
      erreurs.nomPoisson = 'Le nom du poisson est obligatoire';
    if (quantiteMin && (isNaN(quantiteMin) || quantiteMin <= 0))
      erreurs.quantiteMin = 'La quantité minimale doit être un nombre positif';
    if (prixMax && (isNaN(prixMax) || prixMax <= 0))
      erreurs.prixMax = 'Le prix maximum doit être un nombre positif';
    return { valide: Object.keys(erreurs).length === 0, erreurs };
  }, []);

  const valeur = useMemo(
    () => ({
      commandes,
      mesCommandes,
      alertes,
      livraisons,
      chargerMesCommandes,
      chargerAlertes,
      chargerLivraisons,
      creerAlerte,
      desactiverAlerte,
      supprimerAlerte,
      passerCommande,
      mettreAJourStatutCommande,
      accepterLivraison,
      terminerLivraison,
      noterLivreur,
      filtrerCommandesParStatut,
      filtrerAlertesParStatut,
      filtrerLivraisonsParStatut,
      getCommandesEnAttente,
      getCommandesEnCours,
      getCommandesTerminees,
      getVentesTotal,
      getStatistiquesPêcheur,
      getStatistiquesAcheteur,
      validerCommande,
      validerAlerte,
    }),
    [
      commandes,
      mesCommandes,
      alertes,
      livraisons,
      chargerMesCommandes,
      chargerAlertes,
      chargerLivraisons,
      creerAlerte,
      desactiverAlerte,
      supprimerAlerte,
      passerCommande,
      mettreAJourStatutCommande,
      accepterLivraison,
      terminerLivraison,
      noterLivreur,
      filtrerCommandesParStatut,
      filtrerAlertesParStatut,
      filtrerLivraisonsParStatut,
      getCommandesEnAttente,
      getCommandesEnCours,
      getCommandesTerminees,
      getVentesTotal,
      getStatistiquesPêcheur,
      getStatistiquesAcheteur,
      validerCommande,
      validerAlerte,
    ]
  );

  return <CommandeContext.Provider value={valeur}>{children}</CommandeContext.Provider>;
};

export default CommandeContext;