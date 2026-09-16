import React from 'react';
import logo from '../assets/logo-lebougui.jpeg';
import bgPiogue from '../assets/hero.png'; // Placez l'image de la pirogue sous le nom hero.jpg ou pirogue.jpg

export default function AuthLayout({ children, badgeText, title }) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start bg-slate-950 font-sans text-slate-800">
      
      {/* Background Pirogue avec overlay sombre */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url(${bgPiogue})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/90 backdrop-blur-[1px] z-0" />

      {/* Header & Logo */}
      <div className="relative z-10 w-full max-w-md px-4 pt-10 pb-4 flex flex-col items-center">
        <div className="relative mb-3">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full blur-md opacity-40"></div>
          <div className="relative flex items-center justify-center bg-white/95 p-3 rounded-full shadow-2xl border border-white/20">
            <img 
              src={logo} 
              alt="Lebougui Logo" 
              className="h-16 w-16 object-contain rounded-full"
            />
          </div>
        </div>

        <div className="text-center space-y-1">
          {badgeText && (
            <span className="text-xs tracking-widest text-orange-400 uppercase font-black drop-shadow">
              {badgeText}
            </span>
          )}
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
            {title || 'Lebougui'}
          </h1>
        </div>
      </div>

      {/* Contenu Formulaire */}
      <div className="relative z-10 w-full max-w-md px-4 pb-12">
        {children}
      </div>
    </div>
  );
}