import API from './api';

export const AdminService = {
  // ═══════════════════════════════════════════════════════════
  // DASHBOARD / STATS
  // ═══════════════════════════════════════════════════════════
  async getStats() {
    const res = await API.get('/admin/stats/');
    return res.data;
  },

  async getStatsChart(jours = 30) {
    const res = await API.get(`/admin/stats-chart/?jours=${jours}`);
    return res.data;
  },

  async getStatsFinancieres() {
    const res = await API.get('/admin/stats-financieres/');
    return res.data;
  },
  

  // ═══════════════════════════════════════════════════════════
  // UTILISATEURS
  // ═══════════════════════════════════════════════════════════
  async getUtilisateurs(role = null) {
    const url = role
      ? `/admin/utilisateurs/?role=${role}`
      : '/admin/utilisateurs/';
    const res = await API.get(url);
    return res.data;
  },

  async getUtilisateur(id) {
    const res = await API.get(`/admin/${id}/detail/`);
    return res.data;
  },

  async validerDocument(userId) {
    const res = await API.post(`/admin/${userId}/valider-document/`);
    return res.data;
  },

  async revoquerDocument(userId) {
    const res = await API.post(`/admin/${userId}/revoquer-document/`);
    return res.data;
  },

  async validerUtilisateur(userId) {
    return this.validerDocument(userId);
  },

  async refuserUtilisateur(userId) {
    return this.revoquerDocument(userId);
  },

  async revoquerBadge(userId, data = {}) {
    const res = await API.post(`/admin/${userId}/revoquer-tous-badges/`, data);
    return res.data;
  },

  async revoquerTousBadges(userId, data = {}) {
    const res = await API.post(`/admin/${userId}/revoquer-tous-badges/`, data);
    return res.data;
  },

  // ═══════════════════════════════════════════════════════════
  // PREMIUM
  // ═══════════════════════════════════════════════════════════
  async getPremiums() {
    const res = await API.get('/admin/premiums/');
    return res.data;
  },

  async validerPremium(premiumId) {
    const res = await API.post(`/admin/${premiumId}/valider-premium/`);
    return res.data;
  },

  async revoquerPremium(premiumId, data = {}) {
    const res = await API.post(`/admin/${premiumId}/revoquer-premium/`, data);
    return res.data;
  },

  async refuserPremium(premiumId) {
    const res = await API.post(`/admin/${premiumId}/refuser-premium/`);
    return res.data;
  },

  // ═══════════════════════════════════════════════════════════
  // VÉHICULES
  // ═══════════════════════════════════════════════════════════
  async getVehicules() {
    const res = await API.get('/admin/vehicules/');
    return res.data;
  },

  async validerVehicule(id) {
    const res = await API.post(`/admin/vehicules/${id}/valider/`);
    return res.data;
  },

  async refuserVehicule(id) {
    const res = await API.post(`/admin/vehicules/${id}/refuser/`);
    return res.data;
  },

  // ═══════════════════════════════════════════════════════════
  // SIGNALEMENTS
  // ═══════════════════════════════════════════════════════════
  async getSignalements(filtres = {}) {
    const params = new URLSearchParams();
    if (filtres.traite !== undefined) params.append('traite', filtres.traite);
    if (filtres.cible) params.append('cible', filtres.cible);
    const qs = params.toString();
    const url = qs ? `/admin/signalements/?${qs}` : '/admin/signalements/';
    const res = await API.get(url);
    return res.data;
  },

  async traiterSignalement(id, actionPrise = 'Signalement pris en compte') {
    const res = await API.post(`/admin/${id}/traiter-signalement/`, {
      action_prise: actionPrise,
    });
    return res.data;
  },

  async getUtilisateursARevoquer() {
    const res = await API.get('/admin/utilisateurs-a-revoquer/');
    return res.data;
  },

  // ═══════════════════════════════════════════════════════════
  // COMMANDES
  // ═══════════════════════════════════════════════════════════
  async getCommandes(statut = null) {
    const url = statut
      ? `/admin/commandes/?statut=${statut}`
      : '/admin/commandes/';
    const res = await API.get(url);
    return res.data;
  },
};