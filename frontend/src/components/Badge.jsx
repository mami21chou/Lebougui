import React from 'react';
import PropTypes from 'prop-types';

const Badge = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  dot = false,
  ...props
}, ref) => {
  // Styles basés sur la variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-white';
      case 'secondary':
        return 'bg-secondary text-white';
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-warning text-white';
      case 'danger':
      case 'error':
        return 'bg-accent text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      case 'light':
        return 'bg-gray-100 text-gray-800';
      case 'dark':
        return 'bg-gray-800 text-white';
      case 'outline':
        return 'border border-primary text-primary';
      case 'outline-secondary':
        return 'border border-secondary text-secondary';
      case 'outline-danger':
        return 'border border-accent text-accent';
      default:
        return 'bg-primary text-white';
    }
  };

  // Tailles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'md':
        return 'px-3 py-1 text-sm';
      case 'lg':
        return 'px-4 py-1.5 text-base';
      case 'xl':
        return 'px-5 py-2 text-lg';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  // Styles de base
  const baseStyles = `
    d-inline-flex
    align-center
    justify-center
    border-radius-full
    font-medium
    ${getVariantStyles()}
    ${getSizeStyles()}
    ${className}
  `;

  return (
    <span ref={ref} className={baseStyles.trim()} {...props}>
      {dot && (
        <span className="w-1.5 h-1.5 bg-white border-radius-full mr-1" />
      )}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'success', 'warning', 'danger', 'error',
    'info', 'light', 'dark', 'outline', 'outline-secondary', 'outline-danger'
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  dot: PropTypes.bool,
};

// Badge de statut pour les commandes
export const StatutBadge = ({ statut, className = '' }) => {
  const getStatutVariant = () => {
    switch (statut?.toLowerCase()) {
      case 'en_attente':
      case 'pending':
        return 'warning';
      case 'en_cours':
      case 'in_progress':
        return 'info';
      case 'terminee':
      case 'completed':
        return 'success';
      case 'annulee':
      case 'cancelled':
        return 'danger';
      default:
        return 'light';
    }
  };

  const getStatutLabel = () => {
    switch (statut?.toLowerCase()) {
      case 'en_attente':
        return 'En attente';
      case 'en_cours':
        return 'En cours';
      case 'terminee':
        return 'Terminée';
      case 'annulee':
        return 'Annulée';
      default:
        return statut || 'Inconnu';
    }
  };

  return (
    <Badge variant={getStatutVariant()} className={className}>
      {getStatutLabel()}
    </Badge>
  );
};

StatutBadge.propTypes = {
  statut: PropTypes.string.isRequired,
  className: PropTypes.string,
};

// Badge de catégorie pour les produits
export const CategorieBadge = ({ categorie, className = '' }) => {
  return (
    <Badge variant="outline" className={className}>
      {categorie || 'Non spécifié'}
    </Badge>
  );
};

CategorieBadge.propTypes = {
  categorie: PropTypes.string,
  className: PropTypes.string,
};

export default Badge;
