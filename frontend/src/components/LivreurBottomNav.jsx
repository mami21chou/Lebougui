import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bike, Map, Wallet, User } from 'lucide-react';
import API from '../services/api';

export default function LivreurBottomNav({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const isActive = (paths) => paths.some((p) => path.includes(p));

  const [enCours, setEnCours] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const charger = async () => {
      try {
        const res = (await API.get('/livraisons/en-cours/')).data;
        if (!cancelled) setEnCours(res?.en_cours || null);
      } catch {
        if (!cancelled) setEnCours(null);
      }
    };
    charger();
    const interval = setInterval(charger, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [path]);

  const targetGPS = enCours
    ? `/livreur/livraison/${enCours.id}/gps`
    : '/livreur/gps';

  const items = [
    {
      key: 'courses',
      label: 'Courses',
      Icon: Bike,
      onClick: () => navigate('/livreur/accueil'),
      active: isActive(['/livreur/accueil']),
    },
    {
      key: 'gps',
      label: 'Carte GPS',
      Icon: Map,
      onClick: () => navigate(targetGPS),
      active: isActive(['/gps', '/livreur/gps']),
    },
    {
      key: 'gains',
      label: 'Gains',
      Icon: Wallet,
      onClick: () => navigate('/livreur/gains'),
      active: isActive(['/gains']),
    },
    {
    key: 'profil',
    label: 'Profil',
    Icon: User,
    onClick: () => navigate('/profil'),   
    active: isActive(['/profil']),
    },


  ];

  return (
    <nav
      className={`absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-stone-200/80 bg-white px-6 py-2.5 ${className}`}
    >
      {items.map(({ key, label, Icon, onClick, active }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          className={`flex flex-col items-center gap-0.5 transition ${
            active
              ? 'font-bold text-[#0C3B4A]'
              : 'font-medium text-stone-400 hover:text-stone-700'
          }`}
        >
          <Icon size={19} />
          <span className="text-[10px]">{label}</span>
          {active && (
            <span className="mt-0.5 h-0.5 w-6 rounded-full bg-[#0C3B4A]" />
          )}
        </button>
      ))}
    </nav>
  );
}