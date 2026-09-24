import API from './api';

export const CommandeService = {
  // ============================================
  // ALERTES
  // ============================================
  async creerAlerte(nomPoisson, quantiteMin = null, prixMax = null) {
    const payload = { nom_poisson: nomPoisson };
    if (quantiteMin) payload.quantite_min = quantiteMin;
    if (prixMax) payload.prix_max = prixMax;
    const response = await API.post('/alertes/', payload);
    return response.data;
  },
  async listerAlertes() {
    const response = await API.get('/alertes/');
    return response.data;
  },
  async listerMesAlertes() {
    const response = await API.get('/alertes/?mine=true');
    return response.data;
  },
  async desactiverAlerte(id) {
    const response = await API.patch(`/alertes/${id}/`, { statut: 'desactive' });
    return response.data;
  },
  async supprimerAlerte(id) {
    const response = await API.delete(`/alertes/${id}/`);
    return response.data;
  },

  // ============================================
  // COMMANDES
  // ============================================
  async creerCommande(produitId, quantite) {
    const payload = { produit: produitId, quantite, statut: 'en_attente' };
    const response = await API.post('/commandes/', payload);
    return response.data;
  },

  // Créer une commande avec panier multi-lignes
  async creerCommandeV2(payload) {
    const response = await API.post('/commandes/', payload);
    return response.data;
  },

  async listerCommandes() {
    const response = await API.get('/commandes/');
    return response.data;
  },
  async listerMesCommandes() {
    const response = await API.get('/commandes/?mine=true');
    return response.data;
  },
  async listerCommandesPecheur() {
    const response = await API.get('/commandes/?pecheur=true');
    return response.data;
  },
  async listerCommandesLivreur() {
    const response = await API.get('/commandes/?livreur=true');
    return response.data;
  },
  async getCommande(id) {
    const response = await API.get(`/commandes/${id}/`);
    return response.data;
  },
  async mettreAJourStatutCommande(id, statut) {
    const response = await API.patch(`/commandes/${id}/`, { statut });
    return response.data;
  },

  // ============================================
  // ACTIONS MÉTIER (pêcheur / acheteur)
  // ============================================
  async recupererCommande(commandeId) {
    const response = await API.get(`/commandes/${commandeId}/`);
    return response.data;
  },

  async confirmerCommande(commandeId) {
    const response = await API.post(`/commandes/${commandeId}/confirmer/`);
    return response.data;
  },

  async refuserCommande(commandeId) {
    const response = await API.post(`/commandes/${commandeId}/refuser/`);
    return response.data;
  },

  async annulerCommande(commandeId) {
    const response = await API.post(`/commandes/${commandeId}/annuler/`);
    return response.data;
  },

  // ============================================
  // PAIEMENT (SIMULATION)
  // ============================================
  async payerCommandeSimule(commandeId, moyenPaiement = 'wave', telephone = '') {
    const response = await API.post(`/commandes/${commandeId}/payer-simule/`, {
      moyen_paiement: moyenPaiement,
      telephone: telephone,
    });
    return response.data;
  },

  // ============================================
  // LIVRAISONS
  // ============================================
  async listerLivraisons() {
    const response = await API.get('/livraisons/');
    return response.data;
  },
  async listerMesLivraisons() {
    const response = await API.get('/livraisons/?mine=true');
    return response.data;
  },
  async mettreAJourStatutLivraison(id, statut) {
    const response = await API.patch(`/livraisons/${id}/`, { statut });
    return response.data;
  },

  // ============================================
  // NOTES
  // ============================================
  async noterLivreur(livraisonId, note, commentaire = '') {
    const payload = { livraison: livraisonId, note, commentaire };
    const response = await API.post('/notes/', payload);
    return response.data;
  },
  async listerNotesLivreur(livreurId) {
    const response = await API.get(`/notes/?livreur=${livreurId}`);
    return response.data;
  },


    // ============================================
  // LIVREUR
  // ============================================
  async toggleDisponible(disponible) {
    const response = await API.patch('/livreur/disponible/', { disponible });
    return response.data;
  },

  async listerCoursesDisponibles() {
    const response = await API.get('/livraisons/disponibles/');
    return response.data;
  },

  async accepterCourse(commandeIds) {
    const response = await API.post('/livraisons/accepter/', { commande_ids: commandeIds });
    return response.data;
  },

  async recupererLivraison(livraisonId) {
    const response = await API.post(`/livraisons/${livraisonId}/recuperer/`);
    return response.data;
  },

  async updatePosition(livraisonId, latitude, longitude) {
    const response = await API.post(`/livraisons/${livraisonId}/position/`, {
      latitude, longitude,
    });
    return response.data;
  },

  async terminerLivraison(livraisonId) {
    const response = await API.post(`/livraisons/${livraisonId}/terminer/`);
    return response.data;
  },

  async getLivraisonEnCours() {
    const response = await API.get('/livraisons/en-cours/');
    return response.data;
  },


};