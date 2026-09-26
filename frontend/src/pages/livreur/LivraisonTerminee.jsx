import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Bike, Loader2 } from 'lucide-react';
import LivreurBottomNav from '../../components/LivreurBottomNav';
import API from '../../services/api';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(p) || 0))} FCFA`;

export default function LivraisonTerminee() {
  const navigate = useNavigate();
  const location = useLocation();

  const [livraison, setLivraison] = useState(null);
  const [loading, setLoading] = useState(true);

  // ═══════════════════════════════════════════════════════════
  // Récupérer la dernière livraison terminée du livreur
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // Si la navigation a passé l'objet livraison dans state
    if (location.state?.livraison) {
      setLivraison(location.state.livraison);
      setLoading(false);
      return;
    }

    // Sinon, on recharge la dernière livraison livrée
    const charger = async () => {
      try {
        setLoading(true);
        const res = await API.get('/livraisons/?mine=true&statut=livree&ordering=-id&limit=1');
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setLivraison(data[0] || null);
      } catch (err) {
        console.warn('Impossible de charger la livraison:', err);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [location.state]);

  const montant = livraison?.tarif_livraison || 0;
  const nbCommandes = livraison?.commandes?.length || 0;

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">

          {/* Icône succès */}
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={56} className="text-emerald-600" />
          </div>

          <h1 className="mb-2 text-2xl font-black text-[#0F2A4A]">
            Course terminée !
          </h1>
          <p className="mb-8 text-sm text-stone-500">
            Le client a bien reçu sa commande.
          </p>

          {/* Carte crédit dynamique */}
          <div className="mb-6 w-full rounded-3xl bg-[#0C3B4A] p-5 text-left text-white">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              Crédit instantané
            </p>

            {loading ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 size={20} className="animate-spin text-cyan-300" />
                <span className="text-sm text-cyan-200">Calcul...</span>
              </div>
            ) : (
              <>
                <p className="mt-1 text-3xl font-black">
                  + {formatPrice(montant)}
                </p>
                <p className="mt-1 text-[10px] text-cyan-200">
                  {nbCommandes > 0
                    ? `${nbCommandes} commande${nbCommandes > 1 ? 's' : ''} livrée${nbCommandes > 1 ? 's' : ''}`
                    : 'Solde mis à jour immédiatement'}
                </p>
              </>
            )}
          </div>

          {/* Bouton retour */}
          <button
            onClick={() => navigate('/livreur/accueil')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-4 text-sm font-black text-white shadow-xl transition hover:bg-[#E85A39] active:scale-[0.98]"
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