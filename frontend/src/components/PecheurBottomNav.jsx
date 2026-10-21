import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, Package, ClipboardList, TrendingUp } from 'lucide-react';

export default function PecheurBottomNav({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const isActive = (paths) => paths.some((p) => path.includes(p));

  const handleClick = (targetPath, isCurrent) => {
    if (isCurrent) {
      // Déjà sur la page → scroll top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(targetPath);
    }
  };

  const items = [
    {
      key: 'marche',
      label: 'Marché',
      Icon: Store,
      target: '/pecheur/accueil',
      active: isActive(['/accueil', '/marche']),
    },
    {
      key: 'publications',
      label: 'Publications',
      Icon: Package,
      target: '/pecheur/publications',
      active: isActive(['/publications']),
    },
    {
      key: 'commandes',
      label: 'Commandes',
      Icon: ClipboardList,
      target: '/pecheur/commandes',
      active: isActive(['/commandes']),
    },
    {
      key: 'ventes',
      label: 'Ventes',
      Icon: TrendingUp,
      target: '/pecheur/ventes',
      active: isActive(['/ventes']),
    },
  ];

  return (
    <nav
      className={`fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-full border border-stone-200/60 bg-white/95 px-5 py-2.5 shadow-xl backdrop-blur-md lg:hidden ${className}`}
    >
      {items.map(({ key, label, Icon, target, active }) => (
        <button
          key={key}
          type="button"
          onClick={() => handleClick(target, active)}
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