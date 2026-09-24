import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Bike, Home } from 'lucide-react';
import LivreurBottomNav from '../../components/LivreurBottomNav';

export default function LivraisonTerminee() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={56} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-[#0F2A4A] mb-2">Course terminée !</h1>
          <p className="text-sm text-stone-500 mb-8">
            Le client a bien reçu sa commande.
          </p>

          <div className="w-full rounded-3xl bg-[#0C3B4A] p-5 text-left text-white mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              Crédit instantané
            </p>
            <p className="text-3xl font-black mt-1">+ 1 000 FCFA</p>
            <p className="text-[10px] text-cyan-200 mt-1">
              Solde mis à jour immédiatement
            </p>
          </div>

          <button
            onClick={() => navigate('/livreur/accueil')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-4 text-sm font-black text-white shadow-xl"
          >
            <Bike size={18} />
            Prêt pour la prochaine course
          </button>
        </main>

        <LivreurBottomNav />
      </div>
    </div>
  );
}