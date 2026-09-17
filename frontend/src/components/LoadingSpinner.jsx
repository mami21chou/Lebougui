import React from 'react';

const LoadingSpinner = ({ size = 'md', text = '', className = '' }) => {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeMap[size] || sizeMap.md} rounded-full border-orange-500 border-t-transparent animate-spin`}
        role="status"
        aria-label="Chargement"
      />
      {text && <span className="text-sm text-slate-500">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;

// Spinner plein écran
export const FullPageSpinner = ({ message = 'Chargement...' }) => (
  <div className="fixed inset-0 bg-[#F7F4EF] flex items-center justify-center z-50">
    <LoadingSpinner size="lg" text={message} />
  </div>
);

// Spinner pour conteneur
export const ContainerSpinner = ({ message = 'Chargement...' }) => (
  <div className="w-full flex items-center justify-center py-10">
    <LoadingSpinner size="md" text={message} />
  </div>
);