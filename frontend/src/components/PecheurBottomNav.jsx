import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, Package, ClipboardList, TrendingUp } from 'lucide-react';

export default function PecheurBottomNav({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const isActive = (paths) => paths.some((p) => path.includes(p));

  const items = [
    { key: 'marche', label: 'Marché', Icon: Store, to: '/pecheur/accueil', active: isActive(['/accueil', '/marche']) },
    { key: 'publications', label: 'Publications', Icon: Package, to: '/pecheur/publications', active: isActive(['/publications']) },
    { key: 'commandes', label: 'Commandes', Icon: ClipboardList, to: '/pecheur/commandes', active: isActive(['/commandes']) },
    { key: 'ventes', label: 'Ventes', Icon: TrendingUp, to: '/pecheur/ventes', active: isActive(['/ventes']) },
  ];

  return (
    <nav
      className={`absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-slate-200/80 bg-white px-6 py-2.5 ${className}`}
    >
      {items.map(({ key, label, Icon, to, active }) => (
        <button
          key={key}
          type="button"
          onClick={() => navigate(to)}
          className={`flex flex-col items-center gap-0.5 transition ${
            active ? 'font-bold text-[#0C3B4A]' : 'font-medium text-slate-400 hover:text-slate-700'
          }`}
        >
          <Icon size={19} />
          <span className="text-[10px]">{label}</span>
          {active && <span className="mt-0.5 h-0.5 w-6 rounded-full bg-[#0C3B4A]" />}
        </button>
      ))}
    </nav>
  );
}