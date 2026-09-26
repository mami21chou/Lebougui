import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, User, Package, Truck, CheckCircle,
  Navigation, Clock, RefreshCw, Star, Home,
} from 'lucide-react';
import { useCommandes } from '../../context/CommandeContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AcheteurHeader from '../../components/AcheteurHeader';
import AcheteurBottomNav from '../../components/AcheteurBottomNav';
import useCartCount from '../../hooks/useCartCount';

const fallbackImage = '/images/fallback.png';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(p) || 0))} FCFA`;

const formatHeure = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ═══════════════════════════════════════════════════════════
// ÉTAPES du suivi
// ═══════════════════════════════════════════════════════════
const ETAPES = [
  { key: 'confirmee', label: 'Confirmée', desc: 'Le pêcheur a validé', icon: CheckCircle },
  { key: 'recherche', label: 'Livreur assigné', desc: 'En attente de prise en charge', icon: User },
  { key: 'recuperation', label: 'Récupération', desc: 'Au quai de pêche', icon: Package },
  { key: 'route', label: 'En route', desc: 'Vers votre adresse', icon: Truck },
  { key: 'livree', label: 'Livrée', desc: 'Commande reçue', icon: Home },
];

const getEtapeActuelle = (statut) => {
  switch (statut) {
    case 'en_attente_pecheur':
    case 'en_attente_paiement':
    case 'payee':
      return 1;
    case 'en_recherche_livreur':
      return 2;
    case 'en_livraison':
      return 4;
    case 'livree':
      return 5;
    default:
      return 1;
  }
};

export default function SuiviLivraison() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { mesCommandes, chargerMesCommandes } = useCommandes();
  const { estAuthentifie } = useAuth();
  const cartCount = useCartCount();

  const [commande, setCommande] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [livraison, setLivraison] = useState(null);

  // Chargement initial
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/connexion');
      return;
    }
    if (estAuthentifie()) {
      chargerMesCommandes();
    }
  }, [navigate, estAuthentifie, chargerMesCommandes]);

  // Récupérer la commande
  useEffect(() => {
    if (mesCommandes.liste.length > 0 && id) {
      const found = mesCommandes.liste.find((cmd) => cmd.id == id);
      if (found) setCommande(found);
      setChargement(false);
    } else if (mesCommandes.liste.length > 0) {
      setChargement(false);
    }
  }, [id, mesCommandes.liste]);

  // Récupérer la livraison associée (pour avoir la position GPS du livreur)
  useEffect(() => {
    if (!commande || commande.statut !== 'en_livraison') return;

    let cancelled = false;
    const chargerLivraison = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API_URL}/livraisons/?mine=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results || [];
        const found = list.find((l) => l.commandes?.some((cid) => String(cid) === String(commande.id)));
        if (!cancelled) setLivraison(found || null);
      } catch (err) {
        console.warn(err);
      }
    };

    chargerLivraison();
    const interval = setInterval(chargerLivraison, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [commande]);

  // ═══════════════════════════════════════════════════════════
  // Calcul des totaux (corrigé)
  // ═══════════════════════════════════════════════════════════
  const sousTotal = useMemo(() => {
    if (!commande?.lignes) return 0;
    return commande.lignes.reduce((sum, l) => {
      const qte = Number(l.quantite) || 0;
      const prix = Number(l.prix_unitaire) || 0;
      return sum + qte * prix;
    }, 0);
  }, [commande]);

  const fraisLivraison = Number(commande?.frais_livraison) || 0;
  const total = sousTotal + fraisLivraison;

  const premierProduit = commande?.lignes?.[0]?.produit_detail || {};
  const nbProduits = commande?.lignes?.length || 0;

  const livreurNom =
    livraison?.nom_livreur ||
    commande?.livreur_nom ||
    (commande?.livreur?.prenom ? `${commande.livreur.prenom} ${commande.livreur.nom}` : null);

  const livreurTel = livraison?.telephone_livreur || commande?.telephone_livreur || null;

  const etapeActuelle = getEtapeActuelle(commande?.statut);

  // ═══════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════
  if (chargement) {
    return (
      <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
        <div className="relative flex h-screen w-full max-w-md flex-col items-center justify-center bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
        <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">
          <main className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <Package size={28} className="text-stone-400" />
            </div>
            <h3 className="mt-4 text-base font-bold text-stone-900">
              Commande non trouvée
            </h3>
            <button
              onClick={() => navigate('/acheteur/commandes')}
              className="mt-5 rounded-2xl bg-[#0C3B4A] px-5 py-3 text-xs font-bold text-white"
            >
              Retour à mes commandes
            </button>
          </main>
          <AcheteurBottomNav />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        {/* HEADER */}
        <AcheteurHeader
          title="Suivi livraison"
          subtitle={`Réf. #${commande.numero || commande.id}`}
          cartCount={cartCount}
          showSearch={false}
        />

        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28 pt-3 space-y-4">

          {/* BOUTON RETOUR */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-500 transition hover:text-stone-900"
          >
            <ArrowLeft size={14} />
            <span>Retour</span>
          </button>

          {/* ═══════════════════════════════════════════════
              CARTE DE SUIVI avec ligne pointillée
          ═══════════════════════════════════════════════ */}
          <div className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm">
            {/* En-tête carte */}
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0C3B4A]">
                  <Navigation size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    {commande.statut === 'en_livraison' ? 'En cours' : 'Suivi'}
                  </p>
                  <p className="text-[10px] text-stone-500">
                    {etapeActuelle === 5 ? 'Livré' : `Étape ${etapeActuelle}/5`}
                  </p>
                </div>
              </div>
              {commande.statut === 'en_livraison' }
            </div>

            {/* Zone carte — ligne pointillée entre 2 points */}
            <div className="relative h-44 bg-gradient-to-br from-[#E8F0F4] via-[#F7F4EF] to-[#E8F0F4]">
              {/* Motif grille discrète */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(15,42,74,0.06) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(15,42,74,0.06) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Ligne pointillée courbe entre livreur et destination */}
              <svg
                viewBox="0 0 400 176"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
              >
                {/* Tracé principal */}
                <path
                  d="M 70 130 Q 200 50 330 100"
                  fill="none"
                  stroke="#0C3B4A"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="8 8"
                />
              </svg>

              {/* Point de départ — Livreur */}
              <div className="absolute left-[10%] top-[65%] flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-[#0C3B4A] shadow-lg">
                  <Truck size={16} className="text-white" />
                </div>
                <span className="mt-1 rounded-md bg-white px-2 py-0.5 text-[9px] font-bold text-stone-700 shadow-sm">
                  Livreur
                </span>
              </div>

              {/* Point d'arrivée — Destination */}
              <div className="absolute right-[10%] top-[50%] flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-[#FF6B4A] shadow-lg">
                  <Home size={16} className="text-white" />
                </div>
                <span className="mt-1 rounded-md bg-white px-2 py-0.5 text-[9px] font-bold text-stone-700 shadow-sm">
                  Vous
                </span>
              </div>
            </div>

            {/* Info temps + distance */}
            <div className="grid grid-cols-2 divide-x divide-stone-100 border-t border-stone-100">
              <div className="p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Arrivée estimée
                </p>
                <p className="mt-0.5 text-sm font-black text-[#0F2A4A]">
                  {commande.statut === 'en_livraison' ? '~18 min' : '—'}
                </p>
              </div>
              <div className="p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Distance
                </p>
                <p className="mt-0.5 text-sm font-black text-[#0F2A4A]">
                  {commande.distance_km ? `${commande.distance_km} km` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              TIMELINE ÉTAPES (compacte)
          ═══════════════════════════════════════════════ */}
          <div className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Progression
              </p>
            </div>

            <div className="space-y-0">
              {ETAPES.map((etape, idx) => {
                const Icone = etape.icon;
                const numEtape = idx + 1;
                const estTerminee = numEtape < etapeActuelle;
                const estActuelle = numEtape === etapeActuelle;
                const estFuture = numEtape > etapeActuelle;

                return (
                  <div
                    key={etape.key}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      idx !== ETAPES.length - 1 ? 'border-b border-stone-100' : ''
                    }`}
                  >
                    {/* Puce */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        estTerminee
                          ? 'bg-emerald-500 text-white'
                          : estActuelle
                          ? 'bg-[#0C3B4A] text-white'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      <Icone size={14} />
                    </div>

                    {/* Texte */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-bold ${
                          estFuture ? 'text-stone-400' : 'text-stone-900'
                        }`}
                      >
                        {etape.label}
                      </p>
                      <p
                        className={`truncate text-[10px] ${
                          estFuture ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        {etape.desc}
                      </p>
                    </div>

                    {/* Heure si terminée */}
                    {estTerminee && (
                      <span className="shrink-0 text-[10px] font-bold text-emerald-600">
                        ✓
                      </span>
                    )}
                    {estActuelle && (
                      <span className="flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#0C3B4A]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              LIVREUR (si assigné)
          ═══════════════════════════════════════════════ */}
          {livreurNom && (
            <div className="flex items-center justify-between rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-bold text-white">
                  {livreurNom.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Livreur
                  </p>
                  <p className="truncate text-sm font-bold text-stone-900">
                    {livreurNom}
                  </p>
                </div>
              </div>
              <button
                onClick={() => livreurTel && (window.location.href = `tel:${livreurTel}`)}
                disabled={!livreurTel}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-40"
                aria-label="Appeler le livreur"
              >
                <Phone size={16} />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              ADRESSE DE LIVRAISON
          ═══════════════════════════════════════════════ */}
          <div className="flex items-start gap-3 rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B4A]">
              <MapPin size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Adresse de livraison
              </p>
              <p className="mt-0.5 text-sm font-bold leading-snug text-stone-900">
                {commande.adresse_livraison || 'Non spécifiée'}
              </p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              RÉSUMÉ PRIX (corrigé)
          ═══════════════════════════════════════════════ */}
          <div className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Résumé ({nbProduits} article{nbProduits > 1 ? 's' : ''})
              </p>
            </div>

            <div className="space-y-2.5 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Sous-total</span>
                <span className="font-bold text-stone-900">
                  {formatPrice(sousTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Frais de livraison</span>
                <span className="font-bold text-stone-900">
                  {formatPrice(fraisLivraison)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-stone-100 pt-2.5">
                <span className="text-sm font-black text-stone-900">Total</span>
                <span className="text-lg font-black text-[#FF6B4A]">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              ACTIONS
          ═══════════════════════════════════════════════ */}
          <div className="space-y-2 pt-2">
            {commande.statut === 'livree' && (
              <button
                onClick={() => navigate(`/acheteur/commande/${commande.id}`)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 text-xs font-black text-white shadow-md transition hover:bg-amber-600 active:scale-[0.98]"
              >
                <Star size={14} fill="currentColor" />
                Noter cette commande
              </button>
            )}

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] font-bold text-stone-500">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 transition hover:text-stone-900"
              >
                <RefreshCw size={13} />
                Actualiser
              </button>
              <span className="h-3 w-px bg-stone-200" />
              <button
                onClick={() => navigate('/acheteur/commandes')}
                className="flex items-center gap-1.5 transition hover:text-stone-900"
              >
                <ArrowLeft size={13} />
                Mes commandes
              </button>
            </div>
          </div>

        </main>

        <AcheteurBottomNav />
      </div>
    </div>
  );
}