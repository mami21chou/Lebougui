import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Truck, CheckCircle, MapPin, Phone,
} from 'lucide-react';
import { useCommandes } from '../../context/CommandeContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AcheteurHeader from '../../components/AcheteurHeader';
import AcheteurBottomNav from '../../components/AcheteurBottomNav';
import useCartCount from '../../hooks/useCartCount';

const fallbackImage = '/images/fallback.png';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(p) || 0)} FCFA`;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  if (sameDay) return `Aujourd'hui, ${hh}:${mm}`;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const EN_COURS_STATUTS = [
  'en_attente_pecheur',
  'en_attente_paiement',
  'payee',
  'en_recherche_livreur',
  'en_livraison',
];
const LIVREE_STATUTS = ['livree'];
const HISTORIQUE_STATUTS = ['livree', 'annulee', 'refusee'];

const ETAPES = [
  { key: 'confirmee', label: 'Commande confirmée', icone: CheckCircle },
  { key: 'en_livraison', label: 'En cours de livraison', icone: Truck },
  { key: 'reception', label: 'Réception & validation du lot', icone: Package },
];

const getEtapeActuelle = (statut) => {
  switch (statut) {
    case 'en_attente_pecheur':
    case 'en_attente_paiement':
    case 'payee':
      return 0;
    case 'en_recherche_livreur':
    case 'en_livraison':
      return 1;
    case 'livree':
      return 2;
    default:
      return 0;
  }
};

const getStatutLabel = (statut) => {
  switch (statut) {
    case 'en_attente_pecheur': return 'En attente du pêcheur';
    case 'en_attente_paiement': return 'À payer';
    case 'payee': return 'Payée';
    case 'en_recherche_livreur': return 'En recherche de livreur';
    case 'en_livraison': return 'En cours de livraison';
    case 'livree': return 'Livrée';
    case 'annulee': return 'Annulée';
    case 'refusee': return 'Refusée';
    default: return statut;
  }
};

const getStatutCouleur = (statut) => {
  switch (statut) {
    case 'en_attente_pecheur': return { bg: 'bg-amber-50', text: 'text-amber-700' };
    case 'en_attente_paiement': return { bg: 'bg-orange-50', text: 'text-orange-700' };
    case 'payee': return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
    case 'en_recherche_livreur': return { bg: 'bg-blue-50', text: 'text-blue-700' };
    case 'en_livraison': return { bg: 'bg-blue-50', text: 'text-blue-700' };
    case 'livree': return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
    case 'annulee': return { bg: 'bg-slate-100', text: 'text-slate-600' };
    case 'refusee': return { bg: 'bg-rose-50', text: 'text-rose-700' };
    default: return { bg: 'bg-slate-100', text: 'text-slate-600' };
  }
};

export default function MesCommandes() {
  const navigate = useNavigate();
  const { mesCommandes, chargerMesCommandes } = useCommandes();
  const { estAuthentifie } = useAuth();
  const cartCount = useCartCount();

  const [filtreStatut, setFiltreStatut] = useState('en_cours');

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

  const toutesCommandes = mesCommandes.liste || [];

  const commandes = useMemo(() => {
    const sorted = [...toutesCommandes].sort(
      (a, b) =>
        new Date(b.date_commande || b.created_at) -
        new Date(a.date_commande || a.created_at)
    );
    if (filtreStatut === 'en_cours') {
      return sorted.filter((c) => EN_COURS_STATUTS.includes(c.statut));
    }
    if (filtreStatut === 'livrees') {
      return sorted.filter((c) => LIVREE_STATUTS.includes(c.statut));
    }
    return sorted.filter((c) => HISTORIQUE_STATUTS.includes(c.statut));
  }, [toutesCommandes, filtreStatut]);

  const compteurs = useMemo(
    () => ({
      en_cours: toutesCommandes.filter((c) => EN_COURS_STATUTS.includes(c.statut)).length,
      livrees: toutesCommandes.filter((c) => LIVREE_STATUTS.includes(c.statut)).length,
      historique: toutesCommandes.filter((c) => HISTORIQUE_STATUTS.includes(c.statut)).length,
    }),
    [toutesCommandes]
  );

  const calculerTotal = (cmd) =>
    (cmd.lignes || []).reduce(
      (sum, l) => sum + Number(l.prix_unitaire || 0) * Number(l.quantite || 0),
      0
    );

  const quantiteTotale = (cmd) =>
    (cmd.lignes || []).reduce((sum, l) => sum + Number(l.quantite || 0), 0);

  const premierProduit = (cmd) => cmd.lignes?.[0]?.produit_detail || {};

  const handleAppeler = (tel) => {
    if (tel) window.location.href = `tel:${tel}`;
  };

  if (!estAuthentifie()) return null;

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        <AcheteurHeader
          title="Mes Commandes"
          subtitle={`${toutesCommandes.length} commande${toutesCommandes.length > 1 ? 's' : ''} au total`}
          cartCount={cartCount}
          showSearch={false}
        />

        {/* ONGLETS */}
        <div className="no-scrollbar shrink-0 flex gap-2 overflow-x-auto px-5 pb-3">
          {[
            { id: 'en_cours', label: 'En cours', count: compteurs.en_cours },
            { id: 'livrees', label: 'Livrées', count: compteurs.livrees },
            { id: 'historique', label: 'Historique', count: compteurs.historique },
          ].map((tab) => {
            const active = filtreStatut === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFiltreStatut(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-sm transition ${
                  active
                    ? 'bg-[#0C3B4A] text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* LISTE */}
        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-24 pt-2 space-y-3">
          {mesCommandes.chargement ? (
            <div className="py-12 text-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : commandes.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-stone-100 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <Package size={28} className="text-stone-400" />
              </div>
              <h3 className="font-bold text-stone-900 mb-2">
                {filtreStatut === 'en_cours' && 'Aucune commande en cours'}
                {filtreStatut === 'livrees' && 'Aucune commande livrée'}
                {filtreStatut === 'historique' && "Aucune commande dans l'historique"}
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Explorez le marché pour découvrir des produits frais !
              </p>
              <button
                onClick={() => navigate('/acheteur/accueil')}
                className="rounded-xl bg-[#0C3B4A] px-5 py-2.5 text-xs font-bold text-white"
              >
                Explorer le marché
              </button>
            </div>
          ) : (
            commandes.map((cmd) => {
              const badge = getStatutCouleur(cmd.statut);
              const prod = premierProduit(cmd);
              const montant = calculerTotal(cmd);
              const qte = quantiteTotale(cmd);
              const dateRef = cmd.date_commande || cmd.created_at;
              const etapeActuelle = getEtapeActuelle(cmd.statut);
              const pecheurNom =
                cmd.nom_pecheur ||
                `${prod.pecheur_prenom || ''} ${prod.pecheur_nom || ''}`.trim();
              const pecheurVille = prod.adresse || 'Dakar';
              const livreurNom = cmd.livreur_nom || null;
              const telephoneLivreur = cmd.telephone_livreur || null;

              // ⚡ L'itinéraire est cliquable SEULEMENT si en_livraison
              const itineraireActif = cmd.statut === 'en_livraison';

              return (
                <article
                  key={cmd.id}
                  className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm"
                >
                  {/* Bandeau haut */}
                  <div className="flex items-center justify-between px-4 pt-4">
                    <span className="text-[11px] text-stone-400">{formatDate(dateRef)}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}
                    >
                      {getStatutLabel(cmd.statut)}
                    </span>
                  </div>

                  {/* Produit principal */}
                  <div className="flex gap-3 px-4 pt-3 pb-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                      <img
                        src={prod.media || fallbackImage}
                        alt={prod.nom || 'Produit'}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = fallbackImage;
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-extrabold text-[#0F2A4A] leading-snug">
                        {prod.nom || 'Produit'}
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                        {prod.categorie === 'fruit_de_mer' ? 'Fruit de mer' : 'Poisson'} • {qte} kg
                      </p>
                      <p className="mt-2 text-lg font-black text-[#0F2A4A]">
                        {formatPrice(montant)}
                      </p>
                      {cmd.lignes?.length > 1 && (
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          + {cmd.lignes.length - 1} autre
                          {cmd.lignes.length > 2 ? 's' : ''} produit
                          {cmd.lignes.length > 2 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Carte pêcheur — UNIQUEMENT dans l'onglet "En cours" */}
                  {filtreStatut === 'en_cours' && pecheurNom && (
                    <div className="mx-4 mb-3 flex items-center justify-between rounded-2xl bg-[#F7F4EF] px-3 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0C3B4A] text-white text-xs font-bold">
                          {pecheurNom.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {pecheurNom}
                          </p>
                          <p className="text-[10px] text-stone-500 truncate flex items-center gap-1">
                            <MapPin size={9} /> {pecheurVille}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAppeler(cmd.telephone_pecheur)}
                        disabled={!cmd.telephone_pecheur}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-40"
                        aria-label="Appeler le pêcheur"
                      >
                        <Phone size={14} />
                      </button>
                    </div>
                  )}

                  {/* Timeline */}
                  {filtreStatut === 'en_cours' && cmd.statut !== 'en_attente_pecheur' && (
                    <div className="mx-4 mb-3 border-t border-stone-100 pt-3">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700 mb-3">
                        <Truck size={12} className="text-[#0C3B4A]" />
                        Suivi de la marée à l'assiette
                        <span className="ml-auto text-[10px] text-stone-400">
                          {ETAPES.length} étapes
                        </span>
                      </p>

                      <div className="space-y-3">
                        {ETAPES.map((etape, idx) => {
                          const Icone = etape.icone;
                          const estTerminee = idx < etapeActuelle;
                          const estActuelle = idx === etapeActuelle;

                          return (
                            <div key={etape.key} className="relative flex gap-3">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                    estTerminee
                                      ? 'bg-emerald-500 text-white'
                                      : estActuelle
                                      ? 'bg-[#0C3B4A] text-white'
                                      : 'bg-stone-100 text-stone-400'
                                  }`}
                                >
                                  <Icone size={13} />
                                </div>
                                {idx < ETAPES.length - 1 && (
                                  <div
                                    className={`w-0.5 flex-1 my-0.5 ${
                                      estTerminee ? 'bg-emerald-500' : 'bg-stone-200'
                                    }`}
                                  />
                                )}
                              </div>

                              <div className="flex-1 pb-1">
                                <p
                                  className={`text-xs font-bold ${
                                    estTerminee
                                      ? 'text-emerald-700'
                                      : estActuelle
                                      ? 'text-[#0C3B4A]'
                                      : 'text-stone-400'
                                  }`}
                                >
                                  {etape.label}
                                </p>

                                {estActuelle && cmd.statut === 'en_livraison' && (
                                  <div className="mt-2 rounded-2xl bg-[#0F2A4A] p-3 text-white">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="min-w-0">
                                        <p className="text-[10px] text-white/70">
                                          Arrivée estimée dans 18 min
                                        </p>
                                        <p className="text-xs font-bold">
                                          {livreurNom || 'Livreur en route'}
                                        </p>
                                      </div>
                                      <span className="shrink-0 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold">
                                        {cmd.adresse_livraison?.split(',')[0] || 'Dakar'}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {estActuelle &&
                                  etapeActuelle === 0 &&
                                  cmd.statut === 'en_attente_pecheur' && (
                                    <p className="mt-1 text-[10px] text-stone-500">
                                      Le pêcheur vérifie ses stocks...
                                    </p>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ACTIONS */}
                  {filtreStatut === 'en_cours' && (
                    <div className="flex gap-2 px-4 pb-4 pt-2">
                      {/* Bouton ITINÉRAIRE — toujours visible, cliquable SEULEMENT si en_livraison */}
                      <button
                        onClick={() => {
                          if (itineraireActif) {
                            navigate(`/acheteur/suivi-livraison/${cmd.id}`);
                          }
                        }}
                        disabled={!itineraireActif}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-xs font-bold transition ${
                          itineraireActif
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
                            : 'cursor-not-allowed bg-stone-100 text-stone-400'
                        }`}
                        title={
                          itineraireActif
                            ? 'Voir la position du livreur en direct'
                            : 'Disponible dès que le livreur aura accepté'
                        }
                      >
                        <MapPin size={13} />
                        Itinéraire
                      </button>

                      {/* Bouton secondaire intelligent */}
                      {cmd.statut === 'en_livraison' ? (
                        <button
                          onClick={() => handleAppeler(telephoneLivreur)}
                          disabled={!telephoneLivreur}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#0F2A4A] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#0a1f38] disabled:opacity-40"
                        >
                          <Phone size={13} />
                          {livreurNom?.split(' ')[0] || 'Livreur'}
                        </button>
                      ) : cmd.statut === 'en_attente_paiement' ? (
                        <button
                          onClick={() =>
                            navigate(`/acheteur/commande/attente/${cmd.id}`)
                          }
                          className="flex-1 rounded-2xl bg-[#FF6B4A] px-4 py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E85A39] active:scale-[0.98]"
                        >
                          Payer maintenant
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/acheteur/commande/${cmd.id}`)}
                          className="flex-1 rounded-2xl bg-[#0F2A4A] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#0a1f38]"
                        >
                          Voir le détail
                        </button>
                      )}
                    </div>
                  )}

                  {filtreStatut === 'livrees' && (
                    <div className="flex gap-2 px-4 pb-4 pt-2">
                      <button
                        onClick={() => navigate(`/acheteur/commande/${cmd.id}`)}
                        className="flex-1 rounded-2xl bg-stone-100 px-4 py-3 text-xs font-bold text-stone-700 transition hover:bg-stone-200"
                      >
                        Voir le détail
                      </button>
                      <button
                        onClick={() => navigate(`/acheteur/commande/${cmd.id}`)}
                        className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-700"
                      >
                        Noter
                      </button>
                    </div>
                  )}

                  {filtreStatut === 'historique' && (
                    <div className="px-4 pb-4 pt-2">
                      <button
                        onClick={() => navigate(`/acheteur/commande/${cmd.id}`)}
                        className="w-full rounded-2xl bg-stone-100 px-4 py-3 text-xs font-bold text-stone-700 transition hover:bg-stone-200"
                      >
                        Voir le détail
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </main>

        <AcheteurBottomNav />
      </div>
    </div>
  );
}