import React from 'react';
import PropTypes from 'prop-types';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}, ref) => {
  // Styles basés sur la variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary hover:bg-primary-dark text-white border-none';
      case 'secondary':
        return 'bg-secondary hover:bg-secondary-dark text-white border-none';
      case 'outline':
        return 'bg-transparent border border-primary text-primary hover:bg-primary hover:text-white';
      case 'outline-secondary':
        return 'bg-transparent border border-secondary text-secondary hover:bg-secondary hover:text-white';
      case 'danger':
        return 'bg-accent hover:bg-accent-light text-white border-none';
      case 'danger-outline':
        return 'bg-transparent border border-accent text-accent hover:bg-accent hover:text-white';
      case 'light':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-none';
      case 'dark':
        return 'bg-gray-800 hover:bg-gray-900 text-white border-none';
      case 'ghost':
        return 'bg-transparent border-none text-gray-600 hover:bg-gray-100';
      default:
        return 'bg-primary hover:bg-primary-dark text-white border-none';
    }
  };

  // Tailles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-sm h-8';
      case 'md':
        return 'px-4 py-2 text-base h-10';
      case 'lg':
        return 'px-6 py-3 text-lg h-12';
      case 'xl':
        return 'px-8 py-4 text-xl h-14';
      case 'full':
        return 'w-full px-4 py-2 text-base h-10';
      default:
        return 'px-4 py-2 text-base h-10';
    }
  };

  // Styles de base
  const baseStyles = `
    d-inline-flex
    align-center
    justify-center
    border-radius
    font-medium
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
      {...props}
    >
      {loading ? (
        <span className="d-flex align-center gap-2">
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
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'outline', 'outline-secondary',
    'danger', 'danger-outline', 'light', 'dark', 'ghost'
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
};

export default Button;
