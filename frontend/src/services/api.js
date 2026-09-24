import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_DJANGO_URL || 'http://localhost:8000/api',
});

// ═══════════════════════════════════════════════════════════
// INTERCEPTEUR REQUÊTE — Utilise le bon token selon la route
// ═══════════════════════════════════════════════════════════
API.interceptors.request.use(
  (config) => {
    const isAuthRoute =
      config.url.includes('/auth/connexion') ||
      config.url.includes('/auth/inscription') ||
      config.url.includes('/auth/token/refresh');

    if (!isAuthRoute) {
      const isAdminRoute = config.url.includes('/admin/');
      
      // Si c'est une route admin, on cherche 'adminToken', sinon 'access_token'
      const token = isAdminRoute
        ? localStorage.getItem('adminToken')
        : (localStorage.getItem('access_token') || localStorage.getItem('token'));

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn(`Aucun token approprié trouvé pour la route : ${config.url}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ═══════════════════════════════════════════════════════════
// INTERCEPTEUR RÉPONSE — Gestion propre des 401
// ═══════════════════════════════════════════════════════════
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAdminRoute = url.includes('/admin/');
      const isAdminLoginPage = window.location.pathname.includes('/admin/connexion');
      const isNormalLoginPage = window.location.pathname.includes('/connexion');

      if (isAdminRoute && !isAdminLoginPage) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/connexion';
      } else if (!isAdminRoute && !isNormalLoginPage) {
        localStorage.removeItem('access_token');
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(error);
  }
);

export default API;