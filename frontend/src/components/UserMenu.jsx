import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserMenu({ 
  photo, 
  prenom, 
  nom, 
  role,
  showName = true,
}) {
  const navigate = useNavigate();
  const { deconnecter } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeconnexion = () => {
    deconnecter();              // vide le localStorage + reset le contexte
    setOpen(false);
    navigate('/connexion', { replace: true });
  };

  const initiale = (prenom?.[0] || nom?.[0] || 'U').toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Bouton profil */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition"
        aria-label="Menu profil"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-[#0F4C64] flex items-center justify-center">
          {photo ? (
            <img src={photo} alt="Profil" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-sm">{initiale}</span>
          )}
        </div>

        {showName && (
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {(prenom || '').toUpperCase() || 'UTILISATEUR'}
            </p>
            <p className="text-[10px] text-slate-500 capitalize">
              {role || ''}
            </p>
          </div>
        )}

        <ChevronDown size={14} className="text-slate-500" />
      </button>

      {/* Menu déroulant */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden z-50">
          {/* En-tête du menu */}
          <div className="p-3 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F4C64] flex items-center justify-center text-white font-bold">
              {initiale}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {prenom} {nom}
              </p>
              <p className="text-[10px] text-slate-500 capitalize truncate">
                {role}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="p-2">
            <button
              onClick={() => {
              navigate('/profil');
              closeMenu();
            }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition text-sm"
            >
              <User size={16} className="text-slate-500" />
              <span>Mon profil</span>
            </button>


            <button
              onClick={() => {
                setOpen(false);
                navigate('/parametres');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition text-sm"
            >
              <Settings size={16} className="text-slate-500" />
              <span>Paramètres</span>
            </button>
          </div>

          {/* Déconnexion */}
          <div className="p-2 border-t border-slate-100">
            <button
              onClick={handleDeconnexion}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition text-sm font-semibold"
            >
              <LogOut size={16} />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}