import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Calendar } from 'lucide-react';
import { CommandeService } from '../../services/commandeService';
import LivreurBottomNav from '../../components/LivreurBottomNav';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(p) || 0)} FCFA`;

export default function Gains() {
  const [livraisons, setLivraisons] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await CommandeService.listerMesLivraisons?.() || { data: [] };
        setLivraisons(res.data || res || []);
      } catch (e) { console.warn(e); }
    };
    load();
  }, []);

  const total = livraisons
    .filter((l) => l.statut === 'livree')
    .reduce((s, l) => s + Number(l.tarif_livraison || 0), 0);

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        <header className="px-5 pt-6 pb-3 shrink-0">
          <h1 className="text-2xl font-black text-[#0C3B4A]">Mes gains</h1>
        </header>

        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-24 space-y-4">
          <div className="rounded-3xl bg-[#0C3B4A] p-5 text-white">
            <p className="text-[10px] font-bold uppercase text-cyan-300">Solde total</p>
            <p className="text-3xl font-black mt-1">{formatPrice(total)}</p>
            <p className="text-xs text-cyan-200 mt-1">
              {livraisons.filter((l) => l.statut === 'livree').length} courses terminées
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Historique
            </h2>
            {livraisons.length === 0 ? (
              <p className="text-xs text-stone-500">Aucune course terminée.</p>
            ) : (
              livraisons.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Wallet size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-800">
                        Course #{l.id}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {l.date_livraison ? new Date(l.date_livraison).toLocaleDateString('fr-FR') : '—'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-emerald-600">
                    + {formatPrice(l.tarif_livraison)}
                  </p>
                </div>
              ))
            )}
          </div>
        </main>

        <LivreurBottomNav />
      </div>
    </div>
  );
}