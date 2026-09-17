import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

const Sidebar = ({ collapsed: externalCollapsed, onToggleCollapse }) => {
  const { utilisateur, deconnecter, estPecheur, estAcheteur, estLivreur, estAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(externalCollapsed || false);
  const location = useLocation();

  // Synchroniser avec la prop externe
  React.useEffect(() => {
    if (externalCollapsed !== undefined) {
      setCollapsed(externalCollapsed);
    }
  }, [externalCollapsed]);

  // Générer les liens de navigation en fonction du rôle
  const getNavigationLinks = () => {
    const baseLinks = [
      {
        label: 'Accueil',
        path: getHomePath(),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
    ];

    if (estPecheur()) {
      return [
        ...baseLinks,
        {
          label: 'Publier',
          path: '/pecheur/publication/nouvelle',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
        },
        {
          label: 'Mes Publications',
          path: '/pecheur/publications',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          label: 'Commandes reçues',
          path: '/pecheur/commandes',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
            </svg>
          ),
        },
        {
          label: 'Ventes',
          path: '/pecheur/ventes',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ];
    }

    if (estAcheteur()) {
      return [
        ...baseLinks,
        {
          label: 'Marché',
          path: '/acheteur/marche',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          ),
        },
        {
          label: 'Mes Commandes',
          path: '/acheteur/commandes',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
            </svg>
          ),
        },
        {
          label: 'Alertes',
          path: '/acheteur/alertes',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
        },
      ];
    }

    if (estLivreur()) {
      return [
        ...baseLinks,
        {
          label: 'Livraisons',
          path: '/livreur/livraisons',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          ),
        },
        {
          label: 'Historique',
          path: '/livreur/historique',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ];
    }

    if (estAdmin()) {
      return [
        ...baseLinks,
        {
          label: 'Utilisateurs',
          path: '/admin/utilisateurs',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          label: 'Publications',
          path: '/admin/publications',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          label: 'Commandes',
          path: '/admin/commandes',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
            </svg>
          ),
        },
        {
          label: 'Statistiques',
          path: '/admin/statistiques',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
      ];
    }

    return baseLinks;
  };

  const getHomePath = () => {
    if (estPecheur()) return '/pecheur/accueil';
    if (estAcheteur()) return '/acheteur/accueil';
    if (estLivreur()) return '/livreur/accueil';
    if (estAdmin()) return '/admin/accueil';
    return '/';
  };

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onToggleCollapse?.(newState);
  };

  const NavItem = ({ to, label, icon, badge }) => {
    const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

    return (
      <NavLink
        to={to}
        className={`
          d-flex align-center gap-3 px-3 py-2 border-radius
          transition
          ${isActive 
            ? 'bg-primary bg-opacity-10 text-primary font-medium' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
          }
        `}
      >
        <span className={`flex-0 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
          {icon}
        </span>
        {!collapsed && (
          <span className="flex-1 text-ellipsis">{label}</span>
        )}
        {badge && !collapsed && (
          <span className="flex-0 px-2 py-0.5 bg-primary text-white text-xs border-radius-full">
            {badge}
          </span>
        )}
      </NavLink>
    );
  };

  NavItem.propTypes = {
    to: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    badge: PropTypes.node,
  };

  const navLinks = getNavigationLinks();

  return (
    <aside
      className={`
        position-fixed
        top-0
        left-0
        h-full
        bg-white
        border-right border-light
        d-flex flex-column
        transition
        z-200
        ${collapsed ? 'w-16' : 'w-250'}
      `}
    >
      {/* Logo */}
      <div className="p-4 border-bottom border-light">
        {!collapsed ? (
          <div className="d-flex align-center gap-2">
            <div className="w-10 h-10 bg-primary border-radius d-flex align-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <div>
              <div className="font-bold text-lg text-primary">Lebougui</div>
              <div className="text-xs text-gray-500">Plateforme de pêche</div>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-primary border-radius d-flex align-center justify-center mx-auto">
            <span className="text-white font-bold text-lg">L</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="d-flex flex-column gap-1">
          {navLinks.map((link) => (
            <NavItem
              key={link.path}
              to={link.path}
              label={link.label}
              icon={link.icon}
            />
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-3 border-top border-light">
        {!collapsed ? (
          <div className="d-flex align-center gap-3">
            <div className="w-10 h-10 bg-gray-200 border-radius-full d-flex align-center justify-center overflow-hidden">
              {utilisateur?.photo ? (
                <img
                  src={utilisateur.photo}
                  alt="Photo de profil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 font-medium">
                  {(utilisateur?.prenom?.[0] || 'U').toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ellipsis">
                {utilisateur?.prenom && utilisateur?.nom 
                  ? `${utilisateur.prenom} ${utilisateur.nom}`
                  : utilisateur?.telephone
                  : 'Utilisateur'}
              </div>
              <div className="text-xs text-gray-500 text-ellipsis">
                {estPecheur() && 'Pêcheur'}
                {estAcheteur() && 'Acheteur'}
                {estLivreur() && 'Livreur'}
                {estAdmin() && 'Administrateur'}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-gray-200 border-radius-full d-flex align-center justify-center mx-auto">
            {utilisateur?.photo ? (
              <img
                src={utilisateur.photo}
                alt="Photo de profil"
                className="w-full h-full object-cover border-radius-full"
              />
            ) : (
              <span className="text-gray-500 font-medium">
                {(utilisateur?.prenom?.[0] || 'U').toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-top border-light">
        <button
          onClick={toggleCollapse}
          className="w-full d-flex align-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border-none border-radius p-2 cursor-pointer transition"
          aria-label={collapsed ? 'Étendre la barre latérale' : 'Réduire la barre latérale'}
        >
          {collapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  collapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func,
};

export default Sidebar;
