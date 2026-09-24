import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles = [], children }) {
  const { utilisateur, chargement } = useAuth();
  const location = useLocation();

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF]">
        <div className="text-sm text-slate-500">Vérification de la session…</div>
      </div>
    );
  }

  const token = localStorage.getItem('access_token');
  if (!token || !utilisateur) {
    return (
      <Navigate
        to={`/connexion?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (roles.length > 0 && !roles.includes(utilisateur.role)) {
    return <Navigate to={getHomeForRole(utilisateur.role)} replace />;
  }

  return children;
}

function getHomeForRole(role) {
  switch (role) {
    case 'pecheur': return '/pecheur/accueil';
    case 'acheteur': return '/acheteur/accueil';
    case 'livreur': return '/livreur/accueil';
    case 'admin': return '/admin/accueil';
    default: return '/connexion';
  }
}