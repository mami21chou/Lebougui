import React from 'react';
import PropTypes from 'prop-types';

const ButtonIcon = React.forwardRef(({
  icon: Icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  onClick,
  ariaLabel = 'Bouton icône',
  ...props
}, ref) => {
  // Styles basés sur la variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary hover:bg-primary-dark text-white';
      case 'secondary':
        return 'bg-secondary hover:bg-secondary-dark text-white';
      case 'outline':
        return 'bg-transparent border border-primary text-primary hover:bg-primary hover:text-white';
      case 'danger':
        return 'bg-accent hover:bg-accent-light text-white';
      case 'danger-outline':
        return 'bg-transparent border border-accent text-accent hover:bg-accent hover:text-white';
      case 'light':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
      case 'dark':
        return 'bg-gray-800 hover:bg-gray-900 text-white';
      case 'ghost':
        return 'bg-transparent text-gray-600 hover:bg-gray-100';
      default:
        return 'bg-primary hover:bg-primary-dark text-white';
    }
  };

  // Tailles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'md':
        return 'w-10 h-10';
      case 'lg':
        return 'w-12 h-12';
      case 'xl':
        return 'w-14 h-14';
      default:
        return 'w-10 h-10';
    }
  };

  // Styles de base
  const baseStyles = `
    d-inline-flex
    align-center
    justify-center
    border-radius-full
    cursor-pointer
    transition
    ${getVariantStyles()}
    ${getSizeStyles()}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <button
      ref={ref}
      type={type}
      className={baseStyles.trim()}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" />
          <path className="opacity-75" d="M12 2a10 10 0 0 0-7 2.93l4.94-4.94A1 1 0 0 1 12 2z" />
        </svg>
      ) : (
        Icon && <Icon className="w-5 h-5" />
      )}
    </button>
  );
});

ButtonIcon.displayName = 'ButtonIcon';

ButtonIcon.propTypes = {
  icon: PropTypes.elementType.isRequired,
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'outline', 'danger', 
    'danger-outline', 'light', 'dark', 'ghost'
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  ariaLabel: PropTypes.string,
};

export default ButtonIcon;
