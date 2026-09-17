import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, Package, Bell, Star } from 'lucide-react';

export default function AcheteurBottomNav({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const isActive = (paths) => paths.some((p) => path.includes(p));

  const items = [
    {
      key: 'marche',
      label: 'Marché',
      Icon: Store,
      onClick: () => navigate('/acheteur/marche'),
      active: isActive(['/marche', '/accueil']),
    },
    {
      key: 'commandes',
      label: 'Commandes',
      Icon: Package,
      onClick: () => navigate('/acheteur/commandes'),
      active: isActive(['/commandes']),
    },
    {
      key: 'alertes',
      label: 'Alertes',
      Icon: Bell,
      onClick: () => navigate('/acheteur/alertes'),
      active: isActive(['/alertes']),
    },
    {
      key: 'premium',
      label: 'Premium',
      Icon: Star,
      onClick: () => navigate('/acheteur/premium'),
      active: isActive(['/premium']),
    },
  ];

  return (
    <nav
      className={`absolute bottom-3 left-4 right-4 z-30 flex items-center justify-between rounded-full border border-stone-200/60 bg-white/95 px-5 py-2.5 shadow-xl backdrop-blur-md ${className}`}
    >
      {items.map(({ key, label, Icon, onClick, active }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          className={`flex flex-col items-center gap-0.5 transition ${
            active
              ? 'font-extrabold text-[#0C3B4A]'
              : 'font-medium text-stone-400 hover:text-stone-700'
          }`}
        >
          <Icon size={19} />
          <span className="text-[10px]">{label}</span>
        </button>
      ))}
    </nav>
  );
}