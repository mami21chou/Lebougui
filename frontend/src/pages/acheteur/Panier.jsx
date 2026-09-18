import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Trash2, ShoppingBag, Plus, Minus,
  CheckCircle2, Loader2, Clock, XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CommandeService } from '../../services/commandeService';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(p) || 0)} FCFA`;

export default function Panier() {
  const navigate = useNavigate();
  const { utilisateur } = useAuth();

  const cartKey = utilisateur?.id
    ? `panier_acheteur_${utilisateur.id}`
    : 'panier_acheteur_guest';

  const [panier, setPanier] = useState([]);
  const [adresse, setAdresse] = useState('');
  const [etape, setEtape] = useState('recap');   // 'recap' | 'attente' | 'refusee'
  const [commande, setCommande] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [feedback, setFeedback] = useState('');
  const pollRef = useRef(null);

  // Charger le panier
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || '[]');
      setPanier(saved);
    } catch { setPanier([]); }
  }, [cartKey]);

  // Persister le panier
  useEffect(() => {
    if (panier.length >= 0) localStorage.setItem(cartKey, JSON.stringify(panier));
  }, [panier, cartKey]);

  // Polling pendant l'attente
  useEffect(() => {
    if (etape !== 'attente' || !commande?.id) return;

    pollRef.current = setInterval(async () => {
      try {
        const cmd = await CommandeService.recupererCommande(commande.id);
        setCommande(cmd);

        if (cmd.statut === 'en_attente_paiement' || cmd.statut === 'payee') {
          clearInterval(pollRef.current);
          handlePayerMaintenant(cmd);
        } else if (cmd.statut === 'refusee' || cmd.statut === 'annulee') {
          clearInterval(pollRef.current);
          setEtape('refusee');
        }
      } catch (err) {
        console.warn('Erreur polling:', err);
      }
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [etape, commande?.id]);

  // ---------- Actions panier ----------
  const augmenter = (id) =>
    setPanier((prev) => prev.map((i) => i.id === id ? { ...i, quantite: i.quantite + 1 } : i));

  const diminuer = (id) =>
    setPanier((prev) =>
      prev.map((i) => i.id === id ? { ...i, quantite: i.quantite - 1 } : i)
          .filter((i) => i.quantite > 0)
    );

  const retirer = (id) => setPanier((prev) => prev.filter((i) => i.id !== id));

  const vider = () => {
    setPanier([]);
    localStorage.removeItem(cartKey);
  };

  const sousTotal = panier.reduce((s, i) => s + i.prix * i.quantite, 0);

  // ---------- Commander ----------
  const handleCommander = async () => {
    if (!adresse.trim()) { setFeedback('Adresse requise'); return; }
    if (panier.length === 0) { setFeedback('Panier vide'); return; }
    setChargement(true); setFeedback('');

    try {
      const payload = {
        lignes: panier.map((i) => ({ produit_id: i.id, quantite: i.quantite })),
        adresse_livraison: adresse,
      };
      const cmd = await CommandeService.creerCommandeV2(payload);
      setCommande(cmd);
      vider();
      setEtape('attente');
    } catch (err) {
      setFeedback(err.response?.data?.detail || 'Erreur lors de la commande.');
    } finally {
      setChargement(false);
    }
  };

  // ---------- Payer via PayDunya ----------
  const handlePayerMaintenant = async (cmd) => {
    setChargement(true);
    try {
      const res = await CommandeService.initierPaiement(cmd.id);
      window.location.href = res.redirect_url;
    } catch (err) {
      setFeedback(err.response?.data?.erreur || 'Erreur PayDunya.');
      setChargement(false);
    }
  };

  // ==================== RENDU ====================

  // Étape ATTTENTE
  if (etape === 'attente') {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 max-w-md mx-auto">
        <img
          src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800"
          alt="Pêcheur en attente"
          className="w-full h-64 object-cover rounded-3xl mb-6"
        />
        <h2 className="text-xl font-black text-[#0F2A4A] text-center mb-3">
          En attente de confirmation du pêcheur
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
          Le pêcheur vérifie ses stocks physiques pour éviter tout déphasage.
          Vous recevrez une notification dès qu'il aura validé.
        </p>

        <div className="w-full bg-white rounded-3xl p-4 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
              <Clock className="text-slate-400" size={22} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">
                {commande?.numero || 'Commande en cours'}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Loader2 className="animate-spin" size={12} /> Vérification en cours...
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/acheteur/accueil')}
          className="w-full py-4 bg-[#0F2A4A] text-white font-bold rounded-2xl"
        >
          Retour au marché
        </button>
      </div>
    );
  }

  // Étape REFUSÉE
  if (etape === 'refusee') {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center">
        <XCircle size={64} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-black text-[#0F2A4A] mb-3">
          Commande refusée
        </h2>
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

  // Étape RÉCAP (par défaut)
  return (
    <div className="min-h-screen bg-[#FAF6F0] max-w-md mx-auto p-5">
      <header className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-[#0F2A4A]">Mon Panier</h1>
        {panier.length > 0 ? (
          <button onClick={vider} className="text-xs font-bold text-rose-500">
            Vider
          </button>
        ) : <div className="w-10" />}
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

          {/* Liste articles */}
          <div className="space-y-3 mb-4">
            {panier.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
                <img src={item.image} alt={item.nom} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{item.nom}</h3>
                  <p className="text-[11px] text-slate-400">{formatPrice(item.prix)} / {item.unite || 'kg'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button onClick={() => diminuer(item.id)} className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold">{item.quantite}</span>
                    <button onClick={() => augmenter(item.id)} className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                      <Plus size={12} />
                    </button>
                    <span className="ml-auto text-sm font-black">{formatPrice(item.prix * item.quantite)}</span>
                  </div>
                </div>
                <button onClick={() => retirer(item.id)} className="text-slate-300 hover:text-rose-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Adresse */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <label className="text-xs font-bold text-slate-600 block mb-2">Adresse de livraison</label>
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Ex: 12 Rue de la Pêche, Dakar"
              className="w-full px-3 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 outline-none"
            />
          </div>

          {/* Total */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">Total</span>
            <span className="text-lg font-black text-[#FF6B4A]">{formatPrice(sousTotal)}</span>
          </div>

          {/* Bouton Commander */}
          <button
            onClick={handleCommander}
            disabled={chargement}
            className="w-full py-4 bg-[#FF6B4A] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {chargement ? <Loader2 className="animate-spin" size={18} /> : <ShoppingBag size={18} />}
            {chargement ? 'Envoi...' : 'Commander'}
          </button>
        </>
      )}
    </div>
  );
}