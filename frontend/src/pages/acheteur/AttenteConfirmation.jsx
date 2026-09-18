import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Loader2, XCircle, ShoppingBag, Check, Smartphone } from 'lucide-react';
import { CommandeService } from '../../services/commandeService';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(p) || 0)} FCFA`;

export default function AttenteConfirmation() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [commande, setCommande] = useState(null);
  const [etape, setEtape] = useState('attente'); // 'attente' | 'paiement' | 'refusee' | 'erreur'
  const [erreur, setErreur] = useState('');
  const [moyenPaiement, setMoyenPaiement] = useState('wave');
  const [numeroTelephone, setNumeroTelephone] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const pollRef = useRef(null);

  // ---------- Polling toutes les 5s ----------
  useEffect(() => {
    if (!id) return;

    const verifier = async () => {
      try {
        const cmd = await CommandeService.recupererCommande(id);
        setCommande(cmd);

        if (cmd.statut === 'en_attente_paiement' && etape === 'attente') {
          clearInterval(pollRef.current);
          setEtape('paiement');
        } else if (['refusee', 'annulee'].includes(cmd.statut)) {
          clearInterval(pollRef.current);
          setEtape('refusee');
        }
      } catch (err) {
        console.warn('Erreur polling:', err);
      }
    };

    verifier();
    pollRef.current = setInterval(verifier, 5000);
    return () => clearInterval(pollRef.current);
  }, [id, etape]);

  // ---------- Paiement simulé ----------
  const handlePayer = async () => {
    setIsPaying(true);
    try {
      await CommandeService.payerCommandeSimule(id, moyenPaiement, numeroTelephone);
      navigate('/acheteur/commandes');
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors du paiement.');
      setEtape('erreur');
    } finally {
      setIsPaying(false);
    }
  };

  // ---------- Rendu REFUSÉE ----------
  if (etape === 'refusee') {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center">
        <XCircle size={64} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-black text-[#0F2A4A] mb-3">Commande refusée</h2>
        <p className="text-sm text-slate-500 mb-6">
          Le pêcheur n'a pas pu honorer votre commande.
        </p>
        <button
          onClick={() => navigate('/acheteur/accueil')}
          className="w-full py-4 bg-[#0F2A4A] text-white font-bold rounded-2xl"
        >
          Retour au marché
        </button>
      </div>
    );
  }

  // ---------- Rendu ERREUR ----------
  if (etape === 'erreur') {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center">
        <XCircle size={64} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-black text-[#0F2A4A] mb-3">Erreur</h2>
        <p className="text-sm text-slate-500 mb-6">{erreur}</p>
        <button
          onClick={() => navigate('/acheteur/commandes')}
          className="w-full py-4 bg-[#0F2A4A] text-white font-bold rounded-2xl"
        >
          Voir mes commandes
        </button>
      </div>
    );
  }

  // ---------- Rendu PAIEMENT ----------
  if (etape === 'paiement') {
    const total =
      (commande?.lignes || []).reduce(
        (s, l) => s + Number(l.prix_unitaire) * Number(l.quantite),
        0
      ) + Number(commande?.frais_livraison || 0);

    return (
      <div className="min-h-screen bg-[#FAF6F0] max-w-md mx-auto p-5 pb-24">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-[#0F2A4A]">Commande confirmée</h2>
          <p className="text-xs text-slate-500 mt-1">
            Le pêcheur a validé. Vous pouvez maintenant payer.
          </p>
        </div>

        {/* Résumé commande */}
        {commande?.lignes?.length > 0 && (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Résumé de la commande
            </p>
            <div className="space-y-2">
              {commande.lignes.map((l, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-slate-600">
                    {l.produit_detail?.nom || 'Produit'} × {l.quantite} kg
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatPrice(Number(l.prix_unitaire) * Number(l.quantite))}
                  </span>
                </div>
              ))}
            </div>
            {Number(commande.frais_livraison) > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-slate-600">Livraison</span>
                <span className="font-bold text-slate-800">
                  {formatPrice(commande.frais_livraison)}
                </span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-lg font-black text-[#FF6B4A]">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        )}

        {/* Moyen de paiement */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 mb-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-900">Moyen de paiement</h3>

          {/* WAVE */}
          <div
            onClick={() => setMoyenPaiement('wave')}
            className={`flex items-center justify-between rounded-2xl p-3.5 cursor-pointer border transition ${
              moyenPaiement === 'wave'
                ? 'bg-[#E3F6F5] border-[#13B5EA]'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#13B5EA] text-white font-black">
                W
              </div>
              <div>
                <span className="text-sm font-black text-slate-900 block">Wave</span>
                <span className="text-[10px] text-slate-500">Paiement instantané</span>
              </div>
            </div>
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                moyenPaiement === 'wave'
                  ? 'bg-[#004D40] border-[#004D40] text-white'
                  : 'border-slate-300'
              }`}
            >
              {moyenPaiement === 'wave' && <Check size={12} strokeWidth={3} />}
            </div>
          </div>

          {/* ORANGE MONEY */}
          <div
            onClick={() => setMoyenPaiement('om')}
            className={`flex items-center justify-between rounded-2xl p-3.5 cursor-pointer border transition ${
              moyenPaiement === 'om'
                ? 'bg-[#FFF3E0] border-[#FF6600]'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6600] text-white font-black text-xs">
                OM
              </div>
              <div>
                <span className="text-sm font-black text-slate-900 block">
                  Orange Money
                </span>
                <span className="text-[10px] text-slate-500">Paiement mobile</span>
              </div>
            </div>
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                moyenPaiement === 'om'
                  ? 'bg-[#FF6600] border-[#FF6600] text-white'
                  : 'border-slate-300'
              }`}
            >
              {moyenPaiement === 'om' && <Check size={12} strokeWidth={3} />}
            </div>
          </div>

          {/* Téléphone */}
          <div className="pt-1">
            {!isEditingPhone ? (
              <button
                onClick={() => setIsEditingPhone(true)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#0C3B4A] hover:underline"
              >
                <Smartphone size={13} />
                Renseigner mon numéro
                {numeroTelephone && ` (${numeroTelephone})`}
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 pl-2">+221</span>
                <input
                  type="tel"
                  value={numeroTelephone}
                  onChange={(e) => setNumeroTelephone(e.target.value)}
                  placeholder="77 000 00 00"
                  className="w-full text-xs font-bold text-slate-800 outline-none bg-transparent"
                />
                <button
                  onClick={() => setIsEditingPhone(false)}
                  className="rounded-lg bg-[#0C3B4A] px-2.5 py-1 text-[10px] font-bold text-white shrink-0"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Erreur */}
        {erreur && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {erreur}
          </div>
        )}

        {/* Bouton Payer */}
        <button
          onClick={handlePayer}
          disabled={isPaying}
          className="w-full py-4 bg-[#FF6B4A] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isPaying ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Traitement...
            </>
          ) : (
            <>
              <ShoppingBag size={18} />
              Payer maintenant
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-slate-400 mt-3">
          Simulation — aucun débit réel ne sera effectué.
        </p>
      </div>
    );
  }

  // ---------- Rendu ATTENTE (par défaut) ----------
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <img
        src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800"
        alt="Pêcheur en attente"
        className="w-full h-56 object-cover rounded-3xl mb-6 shadow-sm"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src =
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800';
        }}
      />

      <h2 className="text-xl font-black text-[#0F2A4A] text-center mb-3 leading-tight">
        En attente de confirmation du pêcheur
      </h2>

      <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
        Le pêcheur vérifie ses stocks physiques. Vous pourrez payer dès qu'il aura validé.
      </p>

      <div className="w-full bg-white rounded-3xl p-4 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Clock className="text-slate-400" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {commande?.numero || 'Commande en cours'}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Loader2 className="animate-spin" size={12} />
              Vérification en cours...
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/acheteur/commandes')}
        className="w-full py-4 bg-[#0F2A4A] text-white font-bold rounded-2xl flex items-center justify-center gap-2"
      >
        <ShoppingBag size={18} />
        Voir mes commandes
      </button>
    </div>
  );
}