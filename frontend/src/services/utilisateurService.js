import API from './api';

export const UtilisateurService = {
  // ============================================
  // PROFIL
  // ============================================
  
  async getProfil() {
    const response = await API.get('/auth/me/');
    return response.data;
  },

  async mettreAJourProfil(donnees) {
    const formData = new FormData();
    
    // Champs texte
    const champsTexte = ['nom', 'prenom', 'telephone', 'email', 'adresse', 'code_pin'];
    champsTexte.forEach(champ => {
      if (donnees[champ] !== undefined) {
        formData.append(champ, donnees[champ]);
      }
    });
    
    // Photo de profil
    if (donnees.photo) {
      formData.append('photo', donnees.photo);
    }
    
    const response = await API.patch('/auth/me/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ============================================
  // PREMIUM
  // ============================================
  
  async souscrirePremium(typeAbonnement, duree) {
    const payload = {
      fonction: typeAbonnement, // 'abonnement_pecheur' ou 'abonnement_acheteur'
      duree: duree, // en mois
    };
    const response = await API.post('/premium/souscrire/', payload);
    return response.data;
  },

  async getStatutPremium() {
    const response = await API.get('/auth/me/');
    return response.data.status_premium || null;
  },

  // ============================================
  // UTILISATEURS (Admin)
  // ============================================
  
  async listerUtilisateurs(role = null) {
    let url = '/utilisateurs/';
    if (role) {
      url += `?role=${role}`;
    }
    const response = await API.get(url);
    return response.data;
  },

  async getUtilisateur(id) {
    const response = await API.get(`/utilisateurs/${id}/`);
    return response.data;
  },

  async activerDesactiverUtilisateur(id, activer) {
    const response = await API.patch(`/utilisateurs/${id}/`, {
      is_active: activer
    });
    return response.data;
  },

  async supprimerUtilisateur(id) {
    const response = await API.delete(`/utilisateurs/${id}/`);
    return response.data;
  },
};
