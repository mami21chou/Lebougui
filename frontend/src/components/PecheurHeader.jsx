// src/components/PecheurHeader.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Bell, SlidersHorizontal, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';

export default function PecheurHeader({
  title = null,
  subtitle = null,

  showSearch = false,
  searchQuery = '',
  onSearchChange = null,
  onFilterClick = null,
  showFilter = true,

  rightIcon = 'bell',
  onRightIconClick = null,

  locationLabel = 'Soumbédioune · Dakar',

  // NOUVEAU : afficher ou non la vague de transition vers le fond crème
  showWave = true,

  className = '',
}) {
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const [localQuery, setLocalQuery] = useState('');

  const isControlled = typeof onSearchChange === 'function';
  const value = isControlled ? searchQuery : localQuery;
  const handleChange = (e) => {
    const v = e.target.value;
    if (isControlled) onSearchChange(v);
    else setLocalQuery(v);
  };

  const titreAffiche = title
    ? title
    : utilisateur?.prenom
    ? `Salut, ${utilisateur.prenom}`
    : 'Espace pêcheur';

  const sousTitreAffiche = subtitle || locationLabel;

  const handleRightIcon = () => {
    if (onRightIconClick) {
      onRightIconClick();
    } else {
      navigate('/pecheur/notifications');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bandeau principal bleu */}
      <div className="bg-[#0C3B4A] px-4 pb-9 pt-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] font-medium text-white/50">
              <MapPin size={11} /> {sousTitreAffiche}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <h1 className="font-display truncate text-[22px] font-bold leading-tight text-[#FAF6F0]">
                {titreAffiche}
              </h1>
              {utilisateur?.status_premium?.some(
                (p) => p.statut === 'actif' && p.fonction === 'badge_pecheur'
              ) && (
                <Crown size={15} className="shrink-0 text-amber-400" />
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {rightIcon === 'bell' && (
              <button
                type="button"
                onClick={handleRightIcon}
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#FAF6F0] transition hover:bg-white/20"
              >
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#FF6B4A] ring-2 ring-[#0C3B4A]" />
              </button>
            )}
            {rightIcon !== 'bell' && rightIcon !== 'none' && rightIcon}

            <UserMenu
              photo={utilisateur?.photo}
              prenom={utilisateur?.prenom}
              nom={utilisateur?.nom}
              role="Pêcheur"
              showName={false}
            />
          </div>
        </div>
      </div>

      {/* Vague de transition (optionnelle) */}
      {showWave && (
        <svg
          viewBox="0 0 400 28"
          preserveAspectRatio="none"
          className="block h-6 w-full text-[#FAF6F0]"
        >
          <path
            d="M0,28 L0,14 C 50,2 90,2 140,14 C 190,26 230,26 280,14 C 320,4 360,4 400,14 L400,28 Z"
            fill="currentColor"
          />
        </svg>
      )}

      {/* Barre de recherche flottante */}
      {showSearch && (
        <div className="relative -mt-[18px] px-4">
          <div className="flex items-center gap-1.5 rounded-2xl border border-white/50 bg-white/40 p-1.5 shadow-lg shadow-black/5 backdrop-blur-xl">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
              />
              <input
                value={value}
                onChange={handleChange}
                type="search"
                placeholder="Thiof, yaboye, poulpe..."
                className="w-full rounded-xl border-0 bg-white/30 py-2 pl-8 pr-2 text-xs text-stone-800 outline-none placeholder:text-stone-500 backdrop-blur-md"
              />
            </div>
            {showFilter && (
              <button
                type="button"
                aria-label="Filtres"
                onClick={onFilterClick}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/40 text-stone-600 shadow-sm backdrop-blur-md transition hover:bg-white/60"
              >
                <SlidersHorizontal size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}