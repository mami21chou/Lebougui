import API from './api';

export const PublicationService = {
  // 1. Récupération des données globales du marché
  async getMarche() {
    const response = await API.get('/publications/produits/');
    return response.data;
  },

  // 2. Récupération des informations / alertes météo et marée
  async getInformations() {
    const response = await API.get('/publications/informations/');
    return response.data;
  },

  // 3. Récupération des publications spécifiques du pêcheur connecté (méthode demandée par le Dashboard)
  async getInformationsPeche() {
    const response = await API.get('/publications/informations/');
    return response.data;
  },

  // 4. Étape 1 : Analyse IA (Audio + Image)
  async analyserPublication(audioBlob, mediaFile) {
    const formData = new FormData();

    if (audioBlob) {
      formData.append('audio', audioBlob, 'vocal_wolof.webm');
    }
    if (mediaFile) {
      formData.append('media', mediaFile);
    }

    const response = await API.post('/publications/analyser/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // 5. Étape 2A : Création d'un Produit de Pêche
  async creerProduit(payload) {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      if (payload[key] !== null && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });

    const response = await API.post('/publications/produits/creer/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // 6. Étape 2B : Création d'une Information / Alerte
  async creerInformation(payload) {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      if (payload[key] !== null && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });

    const response = await API.post('/publications/informations/creer/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async publier(audioBlob, mediaFile) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'vocal_wolof.webm');
    if (mediaFile) {
      formData.append('media', mediaFile, mediaFile.name || 'photo.jpg');
    }

    const response = await API.post('/publications/publier/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // 7. Le pêcheur active / désactive la disponibilité de son produit
  //    statut : 'disponible' | 'rupture'
  async changerStatutProduit(id, statut) {
    const response = await API.patch(`/publications/produits/${id}/statut/`, { statut });
    return response.data;
  },
};