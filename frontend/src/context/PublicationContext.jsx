import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { PublicationService } from '../services/publicationService';
import { useAuth } from './AuthContext';

const PublicationContext = createContext(null);

export const usePublications = () => {
  const context = useContext(PublicationContext);
  if (!context) {
    throw new Error('usePublications doit être utilisé dans un PublicationProvider');
  }
  return context;
};

export const PublicationProvider = ({ children }) => {
  const { utilisateur, estPecheur } = useAuth();

  const [publications, setPublications] = useState({
    produits: [],
    informations: [],
    chargement: false,
    erreur: null,
  });

  const [mesPublications, setMesPublications] = useState({
    produits: [],
    informations: [],
    chargement: false,
    erreur: null,
  });

  const [analyseIA, setAnalyseIA] = useState({
    data: null,
    chargement: false,
    erreur: null,
  });

  const chargerPublications = useCallback(async (forceRefresh = false) => {
    if (!utilisateur) return;

    setPublications((prev) => {
      if (prev.produits.length > 0 && prev.informations.length > 0 && !forceRefresh) {
        return prev;
      }
      return { ...prev, chargement: true, erreur: null };
    });

    try {
      const [produits, informations] = await Promise.all([
        PublicationService.getMarche(),
        PublicationService.getInformations(),
      ]);
      setPublications({
        produits: produits || [],
        informations: informations || [],
        chargement: false,
        erreur: null,
      });
    } catch (err) {
      const message =
        err.response?.data?.detail || err.message || 'Erreur lors du chargement des publications';
      setPublications((prev) => ({ ...prev, chargement: false, erreur: message }));
    }
  }, [utilisateur]);

  const chargerMesPublications = useCallback(async () => {
    if (!utilisateur || !estPecheur()) return;

    try {
      setMesPublications((prev) => ({ ...prev, chargement: true, erreur: null }));

      const [produits, informations] = await Promise.all([
        PublicationService.getMarche(),
        PublicationService.getInformations(),
      ]);

      const mesProduits = produits.filter((p) => p.pecheur === utilisateur.id);
      const mesInformations = informations.filter((i) => i.pecheur === utilisateur.id);

      setMesPublications({
        produits: mesProduits,
        informations: mesInformations,
        chargement: false,
        erreur: null,
      });
    } catch (err) {
      const message =
        err.response?.data?.detail || err.message || 'Erreur lors du chargement de vos publications';
      setMesPublications((prev) => ({ ...prev, chargement: false, erreur: message }));
    }
  }, [utilisateur, estPecheur]);

  useEffect(() => {
    if (utilisateur) {
      chargerPublications();
    }
  }, [utilisateur, chargerPublications]);

  useEffect(() => {
    if (utilisateur && estPecheur()) {
      chargerMesPublications();
    }
  }, [utilisateur, estPecheur, chargerMesPublications]);

  const analyserPublication = useCallback(
    async (audioBlob, mediaFile = null) => {
      if (!estPecheur()) {
        return { success: false, error: 'Seul un pêcheur peut publier' };
      }
      try {
        setAnalyseIA({ data: null, chargement: true, erreur: null });
        const response = await PublicationService.analyserPublication(audioBlob, mediaFile);
        setAnalyseIA({ data: response, chargement: false, erreur: null });
        return { success: true, data: response };
      } catch (err) {
        const message =
          err.response?.data?.erreur || err.message || "Erreur lors de l'analyse";
        setAnalyseIA({ data: null, chargement: false, erreur: message });
        return { success: false, error: message };
      }
    },
    [estPecheur]
  );

  const creerProduit = useCallback(
    async (payload) => {
      if (!estPecheur()) {
        return { success: false, error: 'Seul un pêcheur peut créer un produit' };
      }
      try {
        const response = await PublicationService.creerProduit(payload);
        await chargerPublications(true);
        await chargerMesPublications();
        return { success: true, data: response };
      } catch (err) {
        const message =
          err.response?.data?.erreur || err.message || 'Erreur lors de la création du produit';
        return { success: false, error: message };
      }
    },
    [estPecheur, chargerPublications, chargerMesPublications]
  );

  const creerInformation = useCallback(
    async (payload) => {
      if (!estPecheur()) {
        return { success: false, error: 'Seul un pêcheur peut créer une information' };
      }
      try {
        const response = await PublicationService.creerInformation(payload);
        await chargerPublications(true);
        await chargerMesPublications();
        return { success: true, data: response };
      } catch (err) {
        const message =
          err.response?.data?.erreur || err.message || "Erreur lors de la création de l'information";
        return { success: false, error: message };
      }
    },
    [estPecheur, chargerPublications, chargerMesPublications]
  );

  const publierDirectement = useCallback(
    async (audioBlob, mediaFile = null) => {
      if (!estPecheur()) {
        return { success: false, error: 'Seul un pêcheur peut publier' };
      }
      try {
        const response = await PublicationService.publier(audioBlob, mediaFile);
        await chargerPublications(true);
        await chargerMesPublications();
        setAnalyseIA({ data: null, chargement: false, erreur: null });
        return { success: true, data: response };
      } catch (err) {
        const message =
          err.response?.data?.erreur || err.message || 'Erreur lors de la publication';
        return { success: false, error: message };
      }
    },
    [estPecheur, chargerPublications, chargerMesPublications]
  );

  // Le pêcheur active / désactive la disponibilité de son produit.
  // On recharge la liste globale (forceRefresh) pour que les acheteurs
  // voient tout de suite le nouveau statut.
  const changerStatutProduit = useCallback(
    async (id, statut) => {
      if (!estPecheur()) {
        return { success: false, error: 'Seul un pêcheur peut modifier un produit' };
      }
      try {
        const response = await PublicationService.changerStatutProduit(id, statut);
        await chargerPublications(true);
        await chargerMesPublications();
        return { success: true, data: response };
      } catch (err) {
        const message =
          err.response?.data?.erreur ||
          err.response?.data?.detail ||
          err.message ||
          'Erreur lors du changement de disponibilité';
        return { success: false, error: message };
      }
    },
    [estPecheur, chargerPublications, chargerMesPublications]
  );

  const filtrerProduitsParCategorie = useCallback(
    (categorie) => {
      if (!categorie) return publications.produits;
      return publications.produits.filter(
        (p) => p.categorie?.toLowerCase() === categorie.toLowerCase()
      );
    },
    [publications.produits]
  );

  const filtrerProduitsParNom = useCallback(
    (nom) => {
      if (!nom) return publications.produits;
      return publications.produits.filter((p) =>
        p.nom?.toLowerCase().includes(nom.toLowerCase())
      );
    },
    [publications.produits]
  );

  const filtrerProduitsParPrix = useCallback(
    (prixMax) => {
      if (!prixMax) return publications.produits;
      return publications.produits.filter((p) => p.prix <= prixMax);
    },
    [publications.produits]
  );

  const rechercherProduits = useCallback(
    (terme) => {
      if (!terme) return publications.produits;
      const termeLower = terme.toLowerCase();
      return publications.produits.filter(
        (p) =>
          p.nom?.toLowerCase().includes(termeLower) ||
          p.categorie?.toLowerCase().includes(termeLower) ||
          p.description?.toLowerCase().includes(termeLower) ||
          p.adresse?.toLowerCase().includes(termeLower)
      );
    },
    [publications.produits]
  );

  const rechercherInformations = useCallback(
    (terme) => {
      if (!terme) return publications.informations;
      const termeLower = terme.toLowerCase();
      return publications.informations.filter(
        (i) =>
          i.description?.toLowerCase().includes(termeLower) ||
          i.adresse?.toLowerCase().includes(termeLower) ||
          i.texte_transcrit?.toLowerCase().includes(termeLower)
      );
    },
    [publications.informations]
  );

  const validerDonneesProduit = useCallback((donnees) => {
    const erreurs = {};
    if (!donnees.nom || donnees.nom.trim() === '') erreurs.nom = 'Le nom est obligatoire';
    if (!donnees.categorie || donnees.categorie.trim() === '')
      erreurs.categorie = 'La catégorie est obligatoire';
    if (donnees.prix === undefined || donnees.prix === null || isNaN(donnees.prix) || donnees.prix <= 0)
      erreurs.prix = 'Le prix doit être un nombre positif';
    if (
      donnees.quantite === undefined ||
      donnees.quantite === null ||
      isNaN(donnees.quantite) ||
      donnees.quantite <= 0
    )
      erreurs.quantite = 'La quantité doit être un nombre positif';
    if (!donnees.adresse || donnees.adresse.trim() === '')
      erreurs.adresse = "L'adresse est obligatoire";
    return { valide: Object.keys(erreurs).length === 0, erreurs };
  }, []);

  const validerDonneesInformation = useCallback((donnees) => {
    const erreurs = {};
    if (!donnees.description || donnees.description.trim() === '')
      erreurs.description = 'La description est obligatoire';
    if (!donnees.adresse || donnees.adresse.trim() === '')
      erreurs.adresse = "L'adresse est obligatoire";
    return { valide: Object.keys(erreurs).length === 0, erreurs };
  }, []);

  const valeur = useMemo(
    () => ({
      publications,
      mesPublications,
      analyseIA,
      chargerPublications,
      chargerMesPublications,
      analyserPublication,
      creerProduit,
      creerInformation,
      publierDirectement,
      changerStatutProduit,
      filtrerProduitsParCategorie,
      filtrerProduitsParNom,
      filtrerProduitsParPrix,
      rechercherProduits,
      rechercherInformations,
      validerDonneesProduit,
      validerDonneesInformation,
    }),
    [
      publications,
      mesPublications,
      analyseIA,
      chargerPublications,
      chargerMesPublications,
      analyserPublication,
      creerProduit,
      creerInformation,
      publierDirectement,
      changerStatutProduit,
      filtrerProduitsParCategorie,
      filtrerProduitsParNom,
      filtrerProduitsParPrix,
      rechercherProduits,
      rechercherInformations,
      validerDonneesProduit,
      validerDonneesInformation,
    ]
  );

  return <PublicationContext.Provider value={valeur}>{children}</PublicationContext.Provider>;
};

export default PublicationContext;