// src/components/AcheteurHeader.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck, MapPin, Search, ShoppingBag, SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';

export default function AcheteurHeader({
  // Titre : soit le greeting automatique, soit un titre fixe
  title = null,
  subtitle = null,

  // Barre de recherche
  showSearch = true,
  searchQuery = '',
  onSearchChange = null,
  onFilterClick = null,
  showFilter = true,

  // Panier
  cartCount = 0,

  // Localisation
  locationLabel = 'Dakar, Plateau',

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

  // Si "title" est fourni, on l'affiche tel quel.
  // Sinon greeting automatique.
  const titreAffiche = title
    ? title
    : utilisateur?.prenom
    ? `Salut, ${utilisateur.prenom}`
    : 'Marché Lebougui';

  const sousTitreAffiche = subtitle || locationLabel;

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
                  (p) => p.statut === 'actif' && p.fonction === 'abonnement_acheteur'
                ) && (
                  <BadgeCheck size={17} className="shrink-0 text-amber-400" />
                )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/acheteur/panier')}
              aria-label={`Panier, ${cartCount} articles`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#FAF6F0] transition hover:bg-white/20"
            >
              <ShoppingBag size={17} />
              {cartCount > 0 && (
                <span className="lb-pop absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#0C3B4A] bg-[#FF6B4A] text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <UserMenu
              photo={utilisateur?.photo}
              prenom={utilisateur?.prenom}
              nom={utilisateur?.nom}
              role="Acheteur"
              showName={false}
            />
          </div>
        </div>
      </div>

      {/* Vague de transition */}
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