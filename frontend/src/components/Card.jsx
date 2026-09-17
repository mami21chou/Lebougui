import React from 'react';
import PropTypes from 'prop-types';

const Card = React.forwardRef(({
  children,
  variant = 'default',
  className = '',
  onClick,
  hoverable = false,
  ...props
}, ref) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-white border-none';
      case 'secondary':
        return 'bg-secondary text-white border-none';
      case 'dark':
        return 'bg-gray-800 text-white border-none';
      case 'outline':
        return 'bg-transparent border border-primary text-primary';
      default:
        return 'bg-white border border-light';
    }
  };

  const baseStyles = `
    border-radius-lg
    overflow-hidden
    transition
    ${getVariantStyles()}
    ${hoverable ? 'cursor-pointer hover-shadow-md' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  return (
    <div
      ref={ref}
      className={baseStyles.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'dark', 'outline']),
  className: PropTypes.string,
  onClick: PropTypes.func,
  hoverable: PropTypes.bool,
};

// Sous-composant : Header
export const CardHeader = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`px-4 py-3 border-bottom border-light ${className}`} {...props}>
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';
CardHeader.propTypes = { children: PropTypes.node, className: PropTypes.string };

// Sous-composant : Body
export const CardBody = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`p-4 ${className}`} {...props}>
    {children}
  </div>
));
CardBody.displayName = 'CardBody';
CardBody.propTypes = { children: PropTypes.node, className: PropTypes.string };

// Sous-composant : Footer
export const CardFooter = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`px-4 py-3 border-top border-light bg-gray-50 ${className}`} {...props}>
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';
CardFooter.propTypes = { children: PropTypes.node, className: PropTypes.string };

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;