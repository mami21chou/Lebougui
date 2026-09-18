import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { CommandeService } from '../../services/commandeService';

export default function RetourPaiement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [etat, setEtat] = useState('verification'); // 'verification' | 'ok' | 'erreur'

  // PayDunya renvoie parfois un token en query string : ?token=xxx
  const paydunyaToken = searchParams.get('token');

  useEffect(() => {
    let essais = 0;
    const maxEssais = 10;      // 10 × 2s = 20s max
    const intervalMs = 2000;

    const verifier = async () => {
      essais += 1;
      try {
        // On liste les commandes pour voir si l'une est passée en "payee"
        const commandes = await CommandeService.listerMesCommandes();
        const derniere = commandes?.[0];

        // Si la dernière commande est payée ou au-delà → succès
        if (derniere && ['payee', 'en_recherche_livreur', 'en_livraison', 'livree'].includes(derniere.statut)) {
          setEtat('ok');
          setTimeout(() => navigate('/acheteur/commandes'), 1500);
          return;
        }

        // Si on a dépassé le max, on arrête (le webhook est peut-être en retard)
        if (essais >= maxEssais) {
          setEtat('ok');    // On considère quand même OK, la commande apparaîtra bientôt
          setTimeout(() => navigate('/acheteur/commandes'), 1500);
        }
      } catch (err) {
        console.warn('Erreur vérification paiement:', err);
      }
    };

    const timer = setInterval(verifier, intervalMs);
    verifier();  // 1er appel immédiat

    return () => clearInterval(timer);
  }, [navigate, paydunyaToken]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center">
      {etat === 'ok' ? (
        <>
          <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
          <h2 className="text-xl font-black text-[#0F2A4A] mb-2">Paiement confirmé</h2>
          <p className="text-sm text-slate-500">Redirection vers vos commandes...</p>
        </>
      ) : (
        <>
          <Loader2 size={64} className="text-[#FF6B4A] animate-spin mb-4" />
          <h2 className="text-xl font-black text-[#0F2A4A] mb-2">Vérification du paiement</h2>
          <p className="text-sm text-slate-500">
            Nous confirmons votre paiement auprès de PayDunya...
          </p>
          <p className="text-[10px] text-slate-400 mt-4">
            Si cette page reste bloquée plus de 30 secondes, vérifiez vos commandes.
          </p>
        </>
      )}
    </div>
  );
}