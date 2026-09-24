import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Phone, Check, X, Package, User, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommandes } from '../../context/CommandeContext';
import { CommandeService } from '../../services/commandeService';
import PecheurBottomNav from '../../components/PecheurBottomNav';

const formatPrice = (price) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(price) || 0)} FCFA`;

const formatRelative = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h}h`;
  const j = Math.floor(h / 24);
  return `Il y a ${j}j`;
};

export default function CommandesRecues() {
  const navigate = useNavigate();
  const { estPecheur } = useAuth();
  const { mesCommandes, chargerMesCommandes } = useCommandes();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtre, setFiltre] = useState('toutes');
  const [enCours, setEnCours] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!estPecheur()) {
          navigate('/connexion', { replace: true });
          return;
        }
        await chargerMesCommandes();
      } catch (err) {
        console.error('Erreur de chargement:', err);
        setError('Impossible de charger vos commandes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [estPecheur, chargerMesCommandes, navigate]);

  const commandes = useMemo(() => {
    const liste = [...(mesCommandes.liste || [])].sort(
      (a, b) =>
        new Date(b.date_commande || b.date || b.created_at) -
        new Date(a.date_commande || a.date || a.created_at)
    );
    if (filtre === 'recuperees') {
      return liste.filter((c) => c.statut === 'en_livraison');
    }
    if (filtre === 'en_attente_paiement') {
      return liste.filter((c) => c.statut === 'en_attente_paiement');
    }
    return liste;
  }, [mesCommandes.liste, filtre]);

  const compteurs = useMemo(() => {
    const liste = mesCommandes.liste || [];
    return {
      toutes: liste.length,
      recuperees: liste.filter((c) => c.statut === 'en_livraison').length,
      en_attente_paiement: liste.filter((c) => c.statut === 'en_attente_paiement').length,
    };
  }, [mesCommandes.liste]);

  // Actions
  const handleAccepter = async (cmd) => {
    setEnCours(cmd.id);
    try {
      await CommandeService.confirmerCommande(cmd.id);
      await chargerMesCommandes();
    } catch (err) {
      console.error('Erreur confirmation:', err);
      alert(err.response?.data?.erreur || 'Impossible de confirmer cette commande.');
    } finally {
      setEnCours(null);
    }
  };

  const handleRefuser = async (cmd) => {
    if (!window.confirm('Refuser cette commande ?')) return;
    setEnCours(cmd.id);
    try {
      await CommandeService.refuserCommande(cmd.id);
      await chargerMesCommandes();
    } catch (err) {
      console.error('Erreur refus:', err);
      alert(err.response?.data?.erreur || 'Impossible de refuser cette commande.');
    } finally {
      setEnCours(null);
    }
  };

  const handleAppeler = (tel) => {
    if (tel) window.location.href = `tel:${tel}`;
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'en_attente_pecheur':
        return { label: 'NOUVELLE COMMANDE', bg: 'bg-amber-50', text: 'text-amber-700' };
      case 'en_attente_paiement':
        return { label: 'EN ATTENTE PAIEMENT', bg: 'bg-orange-50', text: 'text-orange-700' };
      case 'payee':
        return { label: 'PAYÉE', bg: 'bg-emerald-50', text: 'text-emerald-700' };
      case 'en_recherche_livreur':
        return { label: 'EN RECHERCHE LIVREUR', bg: 'bg-blue-50', text: 'text-blue-700' };
      case 'en_livraison':
        return { label: 'RÉCUPÉRÉE', bg: 'bg-blue-50', text: 'text-blue-700' };
      case 'livree':
        return { label: 'LIVRÉE', bg: 'bg-emerald-50', text: 'text-emerald-700'};
      case 'refusee':
        return { label: 'REFUSÉE', bg: 'bg-rose-50', text: 'text-rose-700'};
      case 'annulee':
        return { label: 'ANNULÉE', bg: 'bg-slate-100', text: 'text-slate-600'};
      default:
        return { label: statut || 'INCONNU', bg: 'bg-slate-100', text: 'text-slate-600'};
    }
  };

  const totalCommande = (cmd) =>
    (cmd.lignes || []).reduce(
      (sum, l) => sum + Number(l.prix_unitaire || 0) * Number(l.quantite || 0),
      0
    );

  const quantiteTotale = (cmd) =>
    (cmd.lignes || []).reduce((sum, l) => sum + Number(l.quantite || 0), 0);

  if (!estPecheur()) return null;

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        {/* HEADER */}
        <header className="flex shrink-0 items-center justify-between px-5 pt-6 pb-3">
          <h1 className="text-2xl font-extrabold text-[#0C3B4A]">Commandes</h1>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm">
              <Search size={18} />
            </button>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#FF6B4A]" />
            </button>
          </div>
        </header>

        {/* ONGLETS */}
        <div className="no-scrollbar shrink-0 flex gap-2 overflow-x-auto px-5 pb-3">
          {[
            { id: 'toutes', label: 'Toutes', count: compteurs.toutes },
            { id: 'recuperees', label: 'Récupérées', count: compteurs.recuperees },
            { id: 'en_attente_paiement', label: 'En attente paiement', count: compteurs.en_attente_paiement },
          ].map((tab) => {
            const active = filtre === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFiltre(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-sm transition ${
                  active ? 'bg-[#0C3B4A] text-white' : 'bg-white text-slate-600 hover:bg-stone-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* LISTE */}
        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28 pt-2">
          {loading ? (
            <div className="py-12 text-center text-sm text-stone-500">Chargement...</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              {error}
            </div>
          ) : commandes.length === 0 ? (
            <div className="mt-16 rounded-3xl border border-stone-100 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Package size={28} className="text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Aucune commande</h3>
              <p className="text-xs text-slate-500">Publiez vos prises pour recevoir des commandes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commandes.map((cmd) => {
                const badge = getStatutBadge(cmd.statut);
                const acheteur = cmd.acheteur_detail || {};
                const montant = totalCommande(cmd);
                const qteTotale = quantiteTotale(cmd);
                const dateRef = cmd.date_commande || cmd.date || cmd.created_at;
                const estNouvelle = cmd.statut === 'en_attente_pecheur';
                const enTraitement = enCours === cmd.id;
                const lignes = cmd.lignes || [];

                return (
                  <article key={cmd.id} className="overflow-hidden rounded-3xl border border-stone-100 bg-white p-4 shadow-sm">

                    <div className="flex items-start justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <div className="text-right">
                        <p className="text-lg font-black text-[#FF6B4A] leading-tight">
                          {formatPrice(montant)}
                        </p>
                        <p className="text-[10px] text-stone-400">{formatRelative(dateRef)}</p>
                      </div>
                    </div>

                    <div className="my-3 border-t border-stone-100" />

                    <div className="space-y-2">
                      {lignes.length === 0 && (
                        <p className="text-xs text-stone-400 italic">Détails indisponibles</p>
                      )}
                      {lignes.map((ligne, idx) => {
                        const prod = ligne.produit_detail || {};
                        return (
                          <div key={ligne.id || idx} className="flex gap-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                              <img
                                src={prod.media || 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=200&auto=format&fit=crop&q=80'}
                                alt={prod.nom || 'Produit'}
                                className="h-full w-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=200'; }}
                              />
                              <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                {ligne.quantite} kg
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-extrabold text-[#0C3B4A]">
                                {prod.nom || 'Produit'}
                              </h4>
                              <p className="text-[10px] text-stone-400 mt-0.5">
                                {formatPrice(ligne.prix_unitaire)} / kg
                              </p>
                              <p className="text-xs font-bold text-stone-700 mt-1">
                                {formatPrice(Number(ligne.prix_unitaire) * Number(ligne.quantite))}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {acheteur.prenom || acheteur.nom || cmd.adresse_livraison ? (
                      <div className="mt-3 rounded-2xl border border-stone-100 bg-stone-50 p-3 space-y-1">
                        {(acheteur.prenom || acheteur.nom) && (
                          <p className="flex items-center gap-1.5 text-[11px] text-stone-600">
                            <User size={11} className="text-stone-400" />
                            <span className="font-bold">
                              {acheteur.prenom} {acheteur.nom}
                            </span>
                            {acheteur.telephone && (
                              <span className="text-stone-400">• {acheteur.telephone}</span>
                            )}
                          </p>
                        )}
                        {cmd.adresse_livraison && (
                          <p className="flex items-center gap-1.5 text-[11px] text-stone-500">
                            <MapPin size={11} className="text-stone-400" />
                            {cmd.adresse_livraison}
                          </p>
                        )}
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                      <span className="text-[11px] text-stone-400">
                        {lignes.length} produit{lignes.length > 1 ? 's' : ''} • {qteTotale} kg
                      </span>
                      <span className="text-sm font-black text-[#0F2A4A]">
                        {formatPrice(montant)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleAppeler(acheteur.telephone)}
                        disabled={!acheteur.telephone}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[#0C3B4A] transition hover:bg-slate-200 disabled:opacity-40"
                      >
                        <Phone size={16} />
                      </button>

                      {estNouvelle && (
                        <>
                          <button
                            onClick={() => handleRefuser(cmd)}
                            disabled={enTraitement}
                            className="flex-1 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                          >
                            Refuser
                          </button>
                          <button
                            onClick={() => handleAccepter(cmd)}
                            disabled={enTraitement}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#0A8A5F] px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0C7A54] disabled:opacity-60"
                          >
                            <Check size={14} />
                            {enTraitement ? 'En cours...' : 'Accepter'}
                          </button>
                        </>
                      )}

                      {cmd.statut === 'en_attente_paiement' && (
                        <div className="flex-1 rounded-2xl bg-orange-50 px-4 py-3 text-center text-xs font-bold text-orange-700">
                          En attente du paiement client
                        </div>
                      )}

                      {cmd.statut === 'payee' && (
                        <div className="flex-1 rounded-2xl bg-amber-50 px-4 py-3 text-center text-xs font-bold text-amber-700">
                          Prêt à être remis au livreur
                        </div>
                      )}

                      {cmd.statut === 'en_livraison' && (
                        <div className="flex-1 rounded-2xl bg-blue-50 px-4 py-3 text-center text-xs font-bold text-blue-700">
                          Récupérée par le livreur
                        </div>
                      )}

                      {cmd.statut === 'livree' && (
                        <div className="flex-1 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-xs font-bold text-emerald-700">
                          Commande livrée
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        <PecheurBottomNav />
      </div>
    </div>
  );
}