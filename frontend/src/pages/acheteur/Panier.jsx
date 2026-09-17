import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft, Search, Trash2, ShoppingBag, Plus, Minus,
  CheckCircle2, Check, Smartphone, Store, Package, Bell, Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommandes } from '../../context/CommandeContext';

const formatPrice = (price) => `${new Intl.NumberFormat('fr-FR').format(Number(price) || 0)} FCFA`;

export default function Panier() {
  const navigate = useNavigate();
  const location = useLocation();
  const { utilisateur } = useAuth();
  const { passerCommande } = useCommandes();

  // Clé propre à l'acheteur
  const cartKey = utilisateur?.id ? `panier_acheteur_${utilisateur.id}` : 'panier_acheteur_guest';

  const [panier, setPanier] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(cartKey) || '[]');
    } catch {
      return [];
    }
  });

  const [fraisLivraison] = useState(1500);
  const [isOrdering, setIsOrdering] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Moyen de paiement sélectionné ('wave' ou 'om')
  const [moyenPaiement, setMoyenPaiement] = useState('wave');

  // Numéro de téléphone pour le paiement
  const [numeroTelephone, setNumeroTelephone] = useState(() => utilisateur?.telephone || '770000000');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Persistance du panier dans localStorage
  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(panier));
  }, [panier, cartKey]);

  // Calculs financiers
  const sousTotal = panier.reduce((acc, item) => acc + (Number(item.prix) * Number(item.quantite)), 0);
  const total = sousTotal > 0 ? sousTotal + fraisLivraison : 0;

  // Augmenter la quantité (kg / caisse)
  const augmenterQuantite = (id) => {
    setPanier((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantite: item.quantite + 1 } : item))
    );
  };

  // Diminuer la quantité
  const diminuerQuantite = (id) => {
    setPanier((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantite: item.quantite - 1 } : item))
        .filter((item) => item.quantite > 0)
    );
  };

  // Retirer un produit du panier
  const retirerProduit = (id) => {
    setPanier((prev) => prev.filter((item) => item.id !== id));
  };

  // Vider le panier manuellement
  const viderPanier = () => {
    setPanier([]);
    localStorage.removeItem(cartKey);
  };

  // Masquer le numéro de téléphone pour la confidentialité (ex: +22177••••42)
  const formatPhoneMasked = (phone) => {
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length >= 9) {
      const prefix = cleanPhone.startsWith('221') ? '+221' : '+221 ';
      const digits = cleanPhone.replace('+221', '');
      if (digits.length >= 9) {
        return `${prefix}${digits.slice(0, 2)}••••${digits.slice(-2)}`;
      }
    }
    return `+221 ${phone}`;
  };

  // Valider et payer la commande
  const validerCommande = async () => {
    if (panier.length === 0) return;

    if (!numeroTelephone || numeroTelephone.trim().length < 8) {
      setFeedback('Veuillez renseigner un numéro de téléphone valide.');
      return;
    }

    setIsOrdering(true);

    try {
      // Transmission de chaque article du panier
      for (const item of panier) {
        await passerCommande(item.id, item.quantite);
      }

      const nomMethode = moyenPaiement === 'wave' ? 'Wave' : 'Orange Money';
      viderPanier();
      setFeedback(`Paiement ${nomMethode} initialisé au ${numeroTelephone}. Redirection...`);

      setTimeout(() => {
        navigate('/acheteur/commandes');
      }, 2000);
    } catch (error) {
      setFeedback('Erreur lors de la validation du paiement.');
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">
        
        {/* HEADER */}
        <header className="flex items-center justify-between px-5 pt-6 pb-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-800 shadow-sm transition active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h1 className="text-lg font-extrabold text-[#0C3B4A]">Mon Panier</h1>

          {panier.length > 0 ? (
            <button
              type="button"
              onClick={viderPanier}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition"
            >
              Vider le panier
            </button>
          ) : (
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-800 shadow-sm"
            >
              <Search size={18} />
            </button>
          )}
        </header>

        {/* FEEDBACK TOAST */}
        {feedback && (
          <div className="mx-5 my-2 flex items-center gap-2 rounded-2xl bg-emerald-800 px-4 py-3 text-xs font-bold text-white shadow-lg animate-fade-in">
            <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* CONTENU PANIER */}
        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28 pt-2">
          {panier.length === 0 ? (
            <div className="mt-20 text-center">
              <ShoppingBag size={48} className="mx-auto mb-3 text-stone-300" />
              <p className="text-base font-bold text-stone-700">Votre panier est vide</p>
              <p className="mt-1 text-xs text-stone-400">Découvrez nos arrivages frais sur le marché.</p>
              <button
                type="button"
                onClick={() => navigate('/acheteur/marche')}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#0C3B4A] px-5 py-2.5 text-xs font-bold text-white shadow-md"
              >
                Retour au marché
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* LISTE DES PRODUITS */}
              {panier.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm border border-stone-100/80"
                >
                  <img
                    src={item.image}
                    alt={item.nom}
                    className="h-20 w-20 rounded-2xl object-cover shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-extrabold text-stone-900 truncate">{item.nom}</h3>
                      <button
                        type="button"
                        onClick={() => retirerProduit(item.id)}
                        className="text-stone-300 hover:text-rose-500 transition p-0.5"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    
                    <p className="text-[11px] font-medium text-stone-400 mt-0.5">
                      {formatPrice(item.prix)} / {item.unite || 'kg'}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between">
                      {/* CONTROLEUR QUANTITE */}
                      <div className="flex items-center gap-2.5 rounded-xl bg-stone-100/80 px-2.5 py-1">
                        <button
                          type="button"
                          onClick={() => diminuerQuantite(item.id)}
                          className="text-stone-600 hover:text-stone-900"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-black text-stone-800">
                          {item.quantite} {item.unite || 'kg'}
                        </span>
                        <button
                          type="button"
                          onClick={() => augmenterQuantite(item.id)}
                          className="text-stone-600 hover:text-stone-900"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* PRIX TOTAL DU PRODUIT */}
                      <span className="text-sm font-black text-stone-900">
                        {formatPrice(item.prix * item.quantite)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* RESUME DE LA COMMANDE */}
              <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm border border-stone-100 space-y-3">
                <h2 className="text-base font-extrabold text-[#0C3B4A]">Résumé de la commande</h2>
                
                <div className="flex justify-between text-xs font-medium text-stone-500 pt-1">
                  <span>Sous-total</span>
                  <span className="font-bold text-stone-800">{formatPrice(sousTotal)}</span>
                </div>

                <div className="flex justify-between text-xs font-medium text-stone-500">
                  <span>Livraison</span>
                  <span className="font-bold text-emerald-600">{formatPrice(fraisLivraison)}</span>
                </div>

                <div className="border-t border-stone-100 pt-3 flex justify-between items-center">
                  <span className="text-sm font-extrabold text-stone-900">Total</span>
                  <span className="text-lg font-black text-[#FF6B4A]">{formatPrice(total)}</span>
                </div>
              </div>

              {/* MOYEN DE PAIEMENT MOBILE */}
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-bold text-stone-900">Moyen de paiement mobile</h3>

                {/* WAVE */}
                <div
                  onClick={() => setMoyenPaiement('wave')}
                  className={`relative flex items-center justify-between rounded-2xl p-3.5 cursor-pointer transition border ${
                    moyenPaiement === 'wave'
                      ? 'bg-[#E3F6F5] border-[#13B5EA]'
                      : 'bg-[#F5EFE6] border-transparent hover:bg-stone-200/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#13B5EA] text-white shadow-sm">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-stone-900">Wave</span>
                        <span className="rounded-md bg-[#BBECEB] px-1.5 py-0.5 text-[9px] font-bold text-[#0D7C9E]">
                          
                        </span>
                      </div>
                      <p className="text-xs font-medium text-stone-500">
                        {formatPhoneMasked(numeroTelephone)}
                      </p>
                    </div>
                  </div>

                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    moyenPaiement === 'wave'
                      ? 'bg-[#004D40] border-[#004D40] text-white'
                      : 'border-stone-300 bg-white'
                  }`}>
                    {moyenPaiement === 'wave' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                {/* ORANGE MONEY */}
                <div
                  onClick={() => setMoyenPaiement('om')}
                  className={`relative flex items-center justify-between rounded-2xl p-3.5 cursor-pointer transition border ${
                    moyenPaiement === 'om'
                      ? 'bg-[#FFF3E0] border-[#FF6600]'
                      : 'bg-[#F5EFE6] border-transparent hover:bg-stone-200/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6600] text-white font-black text-xs shadow-sm">
                      OM
                    </div>
                    <div>
                      <span className="text-sm font-black text-stone-900 block">Orange Money</span>
                      <p className="text-xs font-medium text-stone-500">
                        {formatPhoneMasked(numeroTelephone)}
                      </p>
                    </div>
                  </div>

                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    moyenPaiement === 'om'
                      ? 'bg-[#FF6600] border-[#FF6600] text-white'
                      : 'border-stone-300 bg-stone-200/50'
                  }`}>
                    {moyenPaiement === 'om' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                {/* MODIFIER LE NUMERO DE TELEPHONE */}
                <div className="pt-1">
                  {!isEditingPhone ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(true)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-[#0C3B4A] hover:underline"
                    >
                      <Smartphone size={13} />
                      Changer le numéro de téléphone ({numeroTelephone})
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-white p-2 border border-stone-200">
                      <span className="text-xs font-bold text-stone-500 pl-2">+221</span>
                      <input
                        type="tel"
                        value={numeroTelephone}
                        onChange={(e) => setNumeroTelephone(e.target.value)}
                        placeholder="77 000 00 00"
                        className="w-full text-xs font-bold text-stone-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingPhone(false)}
                        className="rounded-lg bg-[#0C3B4A] px-2.5 py-1 text-[10px] font-bold text-white shrink-0"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </main>

        {/* BOUTON CONFIRMER LA COMMANDE */}
        {panier.length > 0 && (
          <div className="absolute bottom-16 left-4 right-4 z-20">
            <button
              type="button"
              disabled={isOrdering}
              onClick={validerCommande}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#E85A39] active:scale-95 disabled:opacity-60"
            >
              <ShoppingBag size={18} />
              {isOrdering ? 'Traitement du paiement...' : 'Confirmer la commande'}
            </button>
          </div>
        )}

        <AcheteurBottomNav/>

      </div>
    </div>
  );
}