import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_DJANGO_URL || 'http://localhost:8000/api',
});

// Intercepteur : Ajoute systématiquement le Bearer Token
API.interceptors.request.use(
  (config) => {
    // Ne pas ajouter le token pour les routes publiques de connexion/inscription
    const isAuthRoute = config.url.includes('/auth/connexion') || config.url.includes('/auth/inscription');
    
    if (!isAuthRoute) {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.error(" Aucun token d'accès trouvé dans le localStorage !");
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse : Empêche la redirection sauvage
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error(" Erreur 401 (Non autorisé) sur :", error.config?.url);
      // Redirige vers la connexion UNIQUEMENT si le token est réellement expiré/inexistant
      if (!localStorage.getItem('access_token')) {
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(error);
  }
);

export default API;