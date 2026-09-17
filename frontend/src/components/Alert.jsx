import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Alert = ({
  variant = 'info',
  title,
  message,
  children,
  onClose,
  dismissible = false,
  className = '',
  icon,
  ...props
}) => {
  const [visible, setVisible] = useState(true);

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800';
      case 'danger':
      case 'error':
        return 'bg-red-50 border-l-4 border-red-500 text-red-800';
      case 'info':
        return 'bg-blue-50 border-l-4 border-blue-500 text-blue-800';
      case 'primary':
        return 'bg-primary bg-opacity-10 border-l-4 border-primary text-primary-dark';
      case 'secondary':
        return 'bg-secondary bg-opacity-10 border-l-4 border-secondary text-secondary-dark';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500 text-blue-800';
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
          </svg>
        );
      case 'danger':
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  return (
    <div
      className={`border-radius p-4 d-flex align-start gap-3 ${getVariantStyles()} ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex-0">
        {getIcon()}
      </div>
      
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        {message && <p className="text-sm">{message}</p>}
        {children}
      </div>
      
      {dismissible && (
        <button
          onClick={handleClose}
          className="flex-0 bg-transparent border-none cursor-pointer p-1 ml-2"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>
      )}
    </div>
  );
};

Alert.propTypes = {
  variant: PropTypes.oneOf(['success', 'warning', 'danger', 'error', 'info', 'primary', 'secondary']),
  title: PropTypes.string,
  message: PropTypes.string,
  children: PropTypes.node,
  onClose: PropTypes.func,
  dismissible: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node,
};

// Alert inline (plus compact)
export const AlertInline = ({ variant = 'info', message, className = '', ...props }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'danger':
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div
      className={`px-3 py-2 border-radius text-sm ${getVariantStyles()} ${className}`}
      {...props}
    >
      {message}
    </div>
  );
};

AlertInline.propTypes = {
  variant: PropTypes.oneOf(['success', 'warning', 'danger', 'error', 'info']),
  message: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default Alert;
