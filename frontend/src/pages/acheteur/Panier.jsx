import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Trash2, ShoppingBag, Plus, Minus, Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePublications } from '../../context/PublicationContext';
import { CommandeService } from '../../services/commandeService';


const fallbackImage = '/images/fallback.png';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(p) || 0)} FCFA`;

export default function Panier() {
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const { publications, chargerPublications } = usePublications();

  // Clé unifiée et robuste
  const cartKey = utilisateur?.id
    ? `panier_acheteur_${utilisateur.id}`
    : 'panier_acheteur_global';

  const [panier, setPanier] = useState([]);
  const [adresse, setAdresse] = useState('');
  const [chargement, setChargement] = useState(false);
  const [feedback, setFeedback] = useState('');
  // ids (en string) des produits que le serveur a signalés comme indisponibles
  const [indisponibles, setIndisponibles] = useState([]);

  // Rafraîchit les statuts des produits à l'ouverture du panier
  useEffect(() => {
    chargerPublications(true);
  }, [chargerPublications]);

  // ids des produits que le pêcheur a désactivés (statut != disponible)
  const indisponiblesMarche = useMemo(() => {
    const ids = new Set();
    (publications?.produits || []).forEach((p) => {
      if (p.statut && p.statut !== 'disponible') ids.add(String(p.id));
    });
    return ids;
  }, [publications?.produits]);

  // Indisponible = signalé par le marché à jour OU refusé par le serveur à la commande
  const estIndispo = (item) =>
    indisponibles.includes(String(item.id)) || indisponiblesMarche.has(String(item.id));

  // Charger le panier au montage
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

  // Sauvegarder dans le localStorage à chaque modification
  const sauvegarderEtMettreAJour = (nouveauPanier) => {
    setPanier(nouveauPanier);
    try {
      localStorage.setItem(cartKey, JSON.stringify(nouveauPanier));
    } catch (e) {
      console.error('Erreur écriture panier:', e);
    }
  };

  const augmenter = (id) => {
    const maj = panier.map((i) =>
      String(i.id) === String(id) ? { ...i, quantite: (Number(i.quantite) || 0) + 1 } : i
    );
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

  // Le total ne compte que les produits encore commandables
  const sousTotal = panier
    .filter((i) => !estIndispo(i))
    .reduce((s, i) => s + Number(i.prix || 0) * Number(i.quantite || 0), 0);

  const nbIndispos = panier.filter(estIndispo).length;

  const handleCommander = async () => {
    if (nbIndispos > 0) {
      setFeedback('Retirez les produits indisponibles avant de commander.');
      return;
    }
    if (!adresse.trim()) {
      setFeedback('Adresse de livraison requise');
      return;
    }
    if (panier.length === 0) {
      setFeedback('Votre panier est vide');
      return;
    }

    setChargement(true);
    setFeedback('');

    try {
      const payload = {
        lignes: panier.map((i) => ({
          produit_id: i.id,
          quantite: Number(i.quantite) || 1,
        })),
        adresse_livraison: adresse,
      };
      const cmd = await CommandeService.creerCommandeV2(payload);
      vider();
      navigate(`/acheteur/commande/attente/${cmd.id}`);
    } catch (err) {
      console.error('Erreur commande:', err);
      const data = err.response?.data;

      // Le serveur nous dit quels produits ne sont plus disponibles
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
        <button
          onClick={() => navigate('/acheteur/accueil')}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-[#0F2A4A]">Mon Panier</h1>
        {panier.length > 0 ? (
          <button onClick={vider} className="text-xs font-bold text-rose-500">
            Vider
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {panier.length === 0 ? (
        <div className="text-center mt-20">
          <ShoppingBag size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="font-bold text-slate-700">Votre panier est vide</p>
          <button
            onClick={() => navigate('/acheteur/accueil')}
            className="mt-5 px-5 py-2.5 bg-[#0F2A4A] text-white text-xs font-bold rounded-2xl"
          >
            Retour au marché
          </button>
        </div>
      ) : (
        <>
          {feedback && (
            <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {feedback}
            </div>
          )}

          {nbIndispos > 0 && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              {nbIndispos === 1
                ? "1 produit de votre panier n'est plus disponible."
                : `${nbIndispos} produits de votre panier ne sont plus disponibles.`}
              <button
                onClick={retirerIndisponibles}
                className="mt-2 block font-bold underline"
              >
                Retirer les produits indisponibles
              </button>
            </div>
          )}

          <div className="space-y-3 mb-4">
            {panier.map((item) => {
              const indispo = estIndispo(item);
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 ${
                    indispo ? 'opacity-60' : ''
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.nom}
                    className={`w-16 h-16 rounded-xl object-cover ${indispo ? 'grayscale' : ''}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = fallbackImage;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {item.nom}
                    </h3>
                    {indispo ? (
                      <p className="text-[11px] font-bold text-rose-600">
                        Produit indisponible
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        {formatPrice(item.prix)} / {item.unite || 'kg'}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => diminuer(item.id)}
                        disabled={indispo}
                        className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center disabled:opacity-40"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold min-w-[20px] text-center">
                        {item.quantite}
                      </span>
                      <button
                        onClick={() => augmenter(item.id)}
                        disabled={indispo}
                        className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center disabled:opacity-40"
                      >
                        <Plus size={12} />
                      </button>
                      <span className={`ml-auto text-sm font-black ${indispo ? 'line-through' : ''}`}>
                        {formatPrice(Number(item.prix) * Number(item.quantite))}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => retirer(item.id)}
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Adresse de livraison
            </label>
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Ex: 12 Rue de la Pêche, Dakar"
              className="w-full px-3 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-[#FF6B4A]/20"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">Total</span>
            <span className="text-lg font-black text-[#FF6B4A]">
              {formatPrice(sousTotal)}
            </span>
          </div>

          <button
            onClick={handleCommander}
            disabled={chargement || nbIndispos > 0}
            className="w-full py-4 bg-[#FF6B4A] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {chargement ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <ShoppingBag size={18} />
            )}
            {chargement
              ? 'Envoi...'
              : nbIndispos > 0
              ? 'Retirez les produits indisponibles'
              : 'Commander'}
          </button>
        </>
      )}
    </div>
  );
}