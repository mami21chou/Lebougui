import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';
import Button from './Button';
import Badge from './Badge';

const Header = ({ onToggleSidebar, showToggle = true, showUser = true }) => {
  const { utilisateur, deconnecter, estPecheur, estAcheteur, estLivreur, estAdmin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const getRoleLabel = () => {
    if (estPecheur()) return 'Pêcheur';
    if (estAcheteur()) return 'Acheteur';
    if (estLivreur()) return 'Livreur';
    if (estAdmin()) return 'Administrateur';
    return 'Utilisateur';
  };

  const getRoleColor = () => {
    if (estPecheur()) return 'primary';
    if (estAcheteur()) return 'secondary';
    if (estLivreur()) return 'info';
    if (estAdmin()) return 'danger';
    return 'light';
  };

  const handleDeconnexion = () => {
    deconnecter();
    navigate('/connexion');
  };

  const notifications = [
    { id: 1, title: 'Nouvelle commande', message: 'Vous avez reçu une nouvelle commande', time: 'Il y a 5 min', read: false },
    { id: 2, title: 'Publication validée', message: 'Votre publication a été validée', time: 'Il y a 1 heure', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header
      className="
        position-sticky
        top-0
        h-16
        bg-white
        border-bottom border-light
        d-flex align-center
        justify-between
        px-6
        z-100
      "
    >
      <div className="d-flex align-center gap-4">
        {/* Toggle Sidebar */}
        {showToggle && (
          <button
            onClick={onToggleSidebar}
            className="d-flex align-center justify-center w-10 h-10 bg-transparent border-none cursor-pointer hover:bg-gray-50 border-radius transition"
            aria-label="Basculer la barre latérale"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Titre / Page actuelle */}
        <div className="d-flex flex-column">
          <h1 className="font-semibold text-lg text-gray-800">
            {getRoleLabel()}
          </h1>
          <span className="text-xs text-gray-500">
            Tableau de bord
          </span>
        </div>
      </div>

      <div className="d-flex align-center gap-3">
        {/* Notifications */}
        <div className="position-relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="d-flex align-center justify-center w-10 h-10 bg-transparent border-none cursor-pointer hover:bg-gray-50 border-radius transition"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          {unreadCount > 0 && (
            <span className="position-absolute top-1 right-1 w-4 h-4 bg-accent text-white text-xs border-radius-full d-flex align-center justify-center">
              {unreadCount}
            </span>
          )}

          {/* Dropdown Notifications */}
          {showNotifications && (
            <div className="position-absolute right-0 mt-2 w-80 bg-white border border-light border-radius-lg shadow-lg overflow-hidden z-300">
              <div className="p-3 border-bottom border-light">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={`
                      w-full p-3 d-flex flex-column align-start gap-1
                      bg-transparent border-none text-left cursor-pointer
                      hover:bg-gray-50 transition
                      ${!notification.read ? 'bg-blue-50' : ''}
                    `}
                  >
                    <div className="d-flex justify-between align-center">
                      <span className="font-medium text-gray-800">{notification.title}</span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary border-radius-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <span className="text-xs text-gray-400">{notification.time}</span>
                  </button>
                ))}
              </div>
              <div className="p-2 border-top border-light">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-full bg-transparent border-none text-primary text-sm cursor-pointer hover:bg-gray-50 p-2"
                >
                  Tout marquer comme lu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profil */}
        {showUser && (
          <div className="position-relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="d-flex align-center gap-2 bg-transparent border-none cursor-pointer p-1"
              aria-label="Menu profil"
            >
              <div className="w-8 h-8 bg-gray-200 border-radius-full d-flex align-center justify-center overflow-hidden">
                {utilisateur?.photo ? (
                  <img
                    src={utilisateur.photo}
                    alt="Photo de profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 font-medium text-sm">
                    {(utilisateur?.prenom?.[0] || utilisateur?.telephone?.[0] || 'U').toUpperCase()}
                  </span>
                )}
              </div>
              <div className="d-flex flex-column text-left">
                <span className="text-sm font-medium text-gray-800">
                  {utilisateur?.prenom && utilisateur?.nom
                    ? `${utilisateur.prenom} ${utilisateur.nom}`
                    : utilisateur?.telephone
                    : 'Utilisateur'}
                </span>
                <Badge variant={getRoleColor()} size="sm">
                  {getRoleLabel()}
                </Badge>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Profile */}
            {showProfileMenu && (
              <div className="position-absolute right-0 mt-2 w-56 bg-white border border-light border-radius-lg shadow-lg overflow-hidden z-300">
                <div className="p-3 border-bottom border-light">
                  <div className="d-flex align-center gap-2">
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
                    <div className="d-flex flex-column">
                      <span className="font-medium text-gray-800">
                        {utilisateur?.prenom && utilisateur?.nom
                          ? `${utilisateur.prenom} ${utilisateur.nom}`
                          : utilisateur?.telephone}
                      </span>
                      <Badge variant={getRoleColor()} size="sm">
                        {getRoleLabel()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <NavLink
                    to="/profil"
                    className="w-full d-flex align-center gap-2 px-3 py-2 bg-transparent border-none text-gray-700 cursor-pointer hover:bg-gray-50 border-radius transition"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Mon profil</span>
                  </NavLink>

                  <NavLink
                    to="/parametres"
                    className="w-full d-flex align-center gap-2 px-3 py-2 bg-transparent border-none text-gray-700 cursor-pointer hover:bg-gray-50 border-radius transition"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Paramètres</span>
                  </NavLink>

                  <button
                    onClick={handleDeconnexion}
                    className="w-full d-flex align-center gap-2 px-3 py-2 bg-transparent border-none text-accent cursor-pointer hover:bg-red-50 border-radius transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-6 0v-1M17 16H7m6 4v1a3 3 0 11-6 0v-1" />
                    </svg>
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

Header.propTypes = {
  onToggleSidebar: PropTypes.func,
  showToggle: PropTypes.bool,
  showUser: PropTypes.bool,
};

// Composant simplifié pour les pages publiques (sans utilisateur)
export const PublicHeader = ({ showAuthButtons = true }) => {
  const navigate = useNavigate();

  return (
    <header
      className="
        position-sticky
        top-0
        h-16
        bg-white
        border-bottom border-light
        d-flex align-center
        justify-between
        px-6
        z-100
      "
    >
      {/* Logo */}
      <div className="d-flex align-center gap-2">
        <div className="w-10 h-10 bg-primary border-radius d-flex align-center justify-center">
          <span className="text-white font-bold text-lg">L</span>
        </div>
        <div>
          <div className="font-bold text-lg text-primary">Lebougui</div>
          <div className="text-xs text-gray-500">Plateforme de pêche</div>
        </div>
      </div>

      {showAuthButtons && (
        <div className="d-flex gap-2">
          <Button variant="outline" onClick={() => navigate('/connexion')}>
            Connexion
          </Button>
          <Button variant="primary" onClick={() => navigate('/inscription')}>
            S'inscrire
          </Button>
        </div>
      )}
    </header>
  );
};

PublicHeader.propTypes = {
  showAuthButtons: PropTypes.bool,
};

// NavLink pour la navigation interne
const NavLink = ({ to, children, className, onClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <button
      onClick={() => {
        navigate(to);
        onClick?.();
      }}
      className={`
        ${className}
        ${isActive ? 'bg-gray-100 text-primary' : 'text-gray-700'}
      `}
    >
      {children}
    </button>
  );
};

NavLink.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default Header;
