import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Trash2, ShoppingBag, Plus, Minus, Loader2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePublications } from '../../context/PublicationContext';
import { CommandeService } from '../../services/commandeService';
import { validators } from '../../utils/validators';


const fallbackImage = '/images/fallback.png';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(p) || 0)} FCFA`;

export default function Panier() {
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const { publications, chargerPublications } = usePublications();

  const cartKey = utilisateur?.id
    ? `panier_acheteur_${utilisateur.id}`
    : 'panier_acheteur_global';

  const [panier, setPanier] = useState([]);
  const [adresse, setAdresse] = useState(utilisateur?.adresse || '');
  const [adresseError, setAdresseError] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [indisponibles, setIndisponibles] = useState([]);

  useEffect(() => {
    chargerPublications(true);
  }, [chargerPublications]);

  const indisponiblesMarche = useMemo(() => {
    const ids = new Set();
    (publications?.produits || []).forEach((p) => {
      if (p.statut && p.statut !== 'disponible') ids.add(String(p.id));
    });
    return ids;
  }, [publications?.produits]);

  const estIndispo = (item) =>
    indisponibles.includes(String(item.id)) || indisponiblesMarche.has(String(item.id));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(cartKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setPanier(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error('Erreur lecture panier:', e);
      setPanier([]);
    }
  }, [cartKey]);

  useEffect(() => {
    if (utilisateur?.adresse && !adresse) {
      setAdresse(utilisateur.adresse);
    }
  }, [utilisateur?.adresse]);

  const handleAdresseChange = (e) => {
    const valeur = e.target.value;
    setAdresse(valeur);
    if (adresseError) setAdresseError(null);
  };

  const handleAdresseBlur = () => {
    const erreur = validators.adresse(adresse);
    setAdresseError(erreur);
  };

  const sauvegarderEtMettreAJour = (nouveauPanier) => {
    setPanier(nouveauPanier);
    try {
      localStorage.setItem(cartKey, JSON.stringify(nouveauPanier));
    } catch (e) {
      console.error('Erreur écriture panier:', e);
    }
  };

  // ═══ AUGMENTER : plafonné au stock ═══
  const augmenter = (id) => {
    const maj = panier.map((i) => {
      if (String(i.id) !== String(id)) return i;

      const nouvelle = (Number(i.quantite) || 0) + 1;
      const stockMax = Number(i.stock) || Infinity;

      if (nouvelle > stockMax) {
        setFeedback(`Stock maximum atteint : ${stockMax} kg disponibles.`);
        setTimeout(() => setFeedback(''), 3000);
        return i;
      }

      return { ...i, quantite: nouvelle };
    });
    sauvegarderEtMettreAJour(maj);
  };

  const diminuer = (id) => {
    const maj = panier
      .map((i) =>
        String(i.id) === String(id) ? { ...i, quantite: (Number(i.quantite) || 0) - 1 } : i
      )
      .filter((i) => (Number(i.quantite) || 0) > 0);
    sauvegarderEtMettreAJour(maj);
  };

  const retirer = (id) => {
    const maj = panier.filter((i) => String(i.id) !== String(id));
    sauvegarderEtMettreAJour(maj);
  };

  const vider = () => {
    sauvegarderEtMettreAJour([]);
    setIndisponibles([]);
    localStorage.removeItem(cartKey);
  };

  const retirerIndisponibles = () => {
    sauvegarderEtMettreAJour(panier.filter((i) => !estIndispo(i)));
    setIndisponibles([]);
    setFeedback('');
  };

  const sousTotal = panier
    .filter((i) => !estIndispo(i))
    .reduce((s, i) => s + Number(i.prix || 0) * Number(i.quantite || 0), 0);

  const nbIndispos = panier.filter(estIndispo).length;

  const handleCommander = async () => {
    if (nbIndispos > 0) {
      setFeedback('Retirez les produits indisponibles avant de commander.');
      return;
    }

    const erreurAdresse = validators.adresse(adresse);
    if (erreurAdresse) {
      setAdresseError(erreurAdresse);
      setFeedback('Veuillez vérifier votre adresse de livraison.');
      return;
    }

    if (panier.length === 0) {
      setFeedback('Votre panier est vide');
      return;
    }

    setChargement(true);
    setFeedback('');
    setAdresseError(null);

    try {
      // ═══ Adresse : celle saisie, sinon celle du profil ═══
      const adresseFinale = (adresse || '').trim() || utilisateur?.adresse || '';

      const payload = {
        lignes: panier.map((i) => ({
          produit_id: i.id,
          quantite: Number(i.quantite) || 1,
        })),
        adresse_livraison: adresseFinale,
      };

      const cmd = await CommandeService.creerCommandeV2(payload);
      vider();
      navigate(`/acheteur/commande/attente/${cmd.id}`);
    } catch (err) {
      console.error('Erreur commande:', err);
      const data = err.response?.data;

      if (Array.isArray(data?.produits_indisponibles)) {
        setIndisponibles(data.produits_indisponibles.map(String));
      }

      setFeedback(
        data?.non_field_errors?.[0] ||
        data?.detail ||
        data?.erreur ||
        err.message ||
        'Erreur lors de la commande.'
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] max-w-md mx-auto p-5 pb-24">
      <header className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/acheteur/accueil')}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-[#0F2A4A]">Mon Panier</h1>
        {panier.length > 0 ? (
          <button onClick={vider} className="text-xs font-bold text-rose-500">Vider</button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {panier.length === 0 ? (
        <div className="text-center mt-20">
          <ShoppingBag size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="font-bold text-slate-700">Votre panier est vide</p>
          <button onClick={() => navigate('/acheteur/accueil')}
            className="mt-5 px-5 py-2.5 bg-[#0F2A4A] text-white text-xs font-bold rounded-2xl">
            Retour au marché
          </button>
        </div>
      ) : (
        <>
          {feedback && (
            <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{feedback}</span>
            </div>
          )}

          {nbIndispos > 0 && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              {nbIndispos === 1
                ? "1 produit de votre panier n'est plus disponible."
                : `${nbIndispos} produits de votre panier ne sont plus disponibles.`}
              <button onClick={retirerIndisponibles} className="mt-2 block font-bold underline">
                Retirer les produits indisponibles
              </button>
            </div>
          )}

          <div className="space-y-3 mb-4">
            {panier.map((item) => {
              const indispo = estIndispo(item);
              const stockMax = Number(item.stock) || Infinity;
              const stockAtteint = Number(item.quantite) >= stockMax;

              return (
                <div key={item.id}
                  className={`bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 ${indispo ? 'opacity-60' : ''}`}>
                  <img src={item.image} alt={item.nom}
                    className={`w-16 h-16 rounded-xl object-cover ${indispo ? 'grayscale' : ''}`}
                    onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} />

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{item.nom}</h3>

                    {indispo ? (
                      <p className="text-[11px] font-bold text-rose-600">Produit indisponible</p>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        {formatPrice(item.prix)} / {item.unite || 'kg'}
                        <span className="ml-1 text-slate-300">
                          (max {stockMax} kg)
                        </span>
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => diminuer(item.id)} disabled={indispo}
                        className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center disabled:opacity-40">
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold min-w-[20px] text-center">{item.quantite}</span>
                      <button onClick={() => augmenter(item.id)}
                        disabled={indispo || stockAtteint}
                        className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                        <Plus size={12} />
                      </button>
                      <span className={`ml-auto text-sm font-black ${indispo ? 'line-through' : ''}`}>
                        {formatPrice(Number(item.prix) * Number(item.quantite))}
                      </span>
                    </div>

                    {stockAtteint && !indispo && (
                      <p className="text-[10px] text-amber-600 font-bold mt-1">
                        Stock maximum atteint
                      </p>
                    )}
                  </div>

                  <button onClick={() => retirer(item.id)} className="text-slate-300 hover:text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600">Adresse de livraison</label>
              {utilisateur?.adresse && adresse !== utilisateur.adresse && (
                <button type="button"
                  onClick={() => { setAdresse(utilisateur.adresse); setAdresseError(null); }}
                  className="text-[10px] font-bold text-[#FF6B4A] hover:underline">
                  Utiliser mon adresse
                </button>
              )}
            </div>

            <input type="text" value={adresse}
              onChange={handleAdresseChange}
              onBlur={handleAdresseBlur}
              placeholder="Ex: 12 Rue de la Pêche, Dakar"
              className={`w-full px-3 py-2 bg-slate-50 rounded-xl text-sm border outline-none focus:ring-2 ${adresseError ? 'border-red-400 ring-2 ring-red-200 focus:ring-red-300' : 'border-slate-200 focus:ring-[#FF6B4A]/20'}`} />

            {adresseError && (
              <p className="mt-1.5 text-[10px] text-red-600 font-medium flex items-center gap-1">
                <AlertCircle size={10} />
                {adresseError}
              </p>
            )}

            {!adresseError && utilisateur?.adresse && adresse === utilisateur.adresse && (
              <p className="mt-1.5 text-[10px] text-emerald-600 font-medium">✓ Adresse enregistrée</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">Total</span>
            <span className="text-lg font-black text-[#FF6B4A]">{formatPrice(sousTotal)}</span>
          </div>

          <button onClick={handleCommander}
            disabled={chargement || nbIndispos > 0}
            className="w-full py-4 bg-[#FF6B4A] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
            {chargement ? <Loader2 className="animate-spin" size={18} /> : <ShoppingBag size={18} />}
            {chargement ? 'Envoi...' : nbIndispos > 0 ? 'Retirez les produits indisponibles' : 'Commander'}
          </button>
        </>
      )}
    </div>
  );
}