import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { PublicHeader } from './Header';

// Layout principal pour les pages protégées (avec sidebar et header)
const Layout = ({
  children,
  showSidebar = true,
  showHeader = true,
  sidebarCollapsed: externalCollapsed,
  ...props
}) => {
  const { estAuthentifie } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(externalCollapsed || false);

  // Synchroniser avec la prop externe
  React.useEffect(() => {
    if (externalCollapsed !== undefined) {
      setSidebarCollapsed(externalCollapsed);
    }
  }, [externalCollapsed]);

  // Si non authentifié, afficher un layout simple
  if (!estAuthentifie()) {
    return (
      <div className="min-h-screen bg-light d-flex flex-column">
        {showHeader && <PublicHeader />}
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  // Layout complet avec sidebar
  return (
    <div className="min-h-screen bg-light d-flex">
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
        />
      )}

      {/* Contenu principal */}
      <div
        className={`
          flex-1
          min-h-screen
          d-flex flex-column
          transition
          ${showSidebar ? 'ml-250' : 'ml-0'}
          ${sidebarCollapsed ? 'ml-16' : showSidebar ? 'ml-250' : 'ml-0'}
        `}
      >
        {/* Header */}
        {showHeader && (
          <Header
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Main Content */}
        <main
          className={`
            flex-1
            p-4
            ${props.className || ''}
          `}
          {...props}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  showSidebar: PropTypes.bool,
  showHeader: PropTypes.bool,
  sidebarCollapsed: PropTypes.bool,
  className: PropTypes.string,
};

// Layout pour les pages publiques (sans sidebar)
export const PublicLayout = ({ children, ...props }) => {
  return (
    <div className="min-h-screen bg-light d-flex flex-column">
      <PublicHeader />
      <main className="flex-1" {...props}>
        {children}
      </main>
    </div>
  );
};

PublicLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

// Layout pour les pages d'authentification (connexion, inscription)
export const AuthLayout = ({ children, ...props }) => {
  return (
    <div className="min-h-screen bg-light d-flex">
      {/* Partie gauche - Image de fond */}
      <div className="flex-1 bg-primary d-none md-d-flex align-center justify-center p-10">
        <div className="max-w-400 text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 border-radius-xl d-flex align-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-4xl">L</span>
          </div>
          <h1 className="text-white font-bold text-3xl mb-3">Lebougui</h1>
          <p className="text-white text-opacity-80 text-lg">
            Plateforme de vente de poissons frais connectant pêcheurs, acheteurs et livreurs.
          </p>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="flex-1 d-flex align-center justify-center p-4 md-p-8">
        <div className="w-full max-w-400">
          {children}
        </div>
      </div>
    </div>
  );
};

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

// Layout pour les pages des pêcheurs
export const PecheurLayout = ({ children, ...props }) => {
  return (
    <Layout showSidebar showHeader {...props}>
      {children}
    </Layout>
  );
};

PecheurLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

// Layout pour les pages des acheteurs
export const AcheteurLayout = ({ children, ...props }) => {
  return (
    <Layout showSidebar showHeader {...props}>
      {children}
    </Layout>
  );
};

AcheteurLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

// Layout pour les pages des livreurs
export const LivreurLayout = ({ children, ...props }) => {
  return (
    <Layout showSidebar showHeader {...props}>
      {children}
    </Layout>
  );
};

LivreurLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

// Layout pour les pages admin
export const AdminLayout = ({ children, ...props }) => {
  return (
    <Layout showSidebar showHeader {...props}>
      {children}
    </Layout>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
