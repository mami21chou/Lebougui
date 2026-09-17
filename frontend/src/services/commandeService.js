import API from './api';

export const CommandeService = {
  // ============================================
  // ALERTES (pour Acheteurs Premium)
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
    const payload = {
      produit: produitId,
      quantite: quantite,
      statut: 'en_attente'
    };
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
  // NOTES (pour Livreurs)
  // ============================================
  
  async noterLivreur(livraisonId, note, commentaire = '') {
    const payload = {
      livraison: livraisonId,
      note: note,
      commentaire: commentaire
    };
    const response = await API.post('/notes/', payload);
    return response.data;
  },

  async listerNotesLivreur(livreurId) {
    const response = await API.get(`/notes/?livreur=${livreurId}`);
    return response.data;
  },
};
