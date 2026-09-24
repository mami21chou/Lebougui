import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, TrendingUp, BarChart3, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommandes } from '../../context/CommandeContext';
import PecheurBottomNav from '../../components/PecheurBottomNav';

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(p) || 0)} FCFA`;

const Ventes = () => {
  const { estPecheur } = useAuth();
  const { mesCommandes, chargerMesCommandes, getStatistiquesPêcheur } = useCommandes();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periode, setPeriode] = useState('mois');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!estPecheur()) {
          navigate('/connexion', { replace: true });
          return;
        }
        await chargerMesCommandes();
      } catch (err) {
        console.error('Erreur de chargement:', err);
        setError('Impossible de charger vos ventes');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [estPecheur, chargerMesCommandes, navigate]);

  const statistiques = getStatistiquesPêcheur();

  // Commandes livrées uniquement (= ventes réelles)
  const commandesTerminees = (mesCommandes.liste || [])
    .filter((cmd) => cmd.statut === 'livree')
    .sort(
      (a, b) =>
        new Date(b.date_commande || b.date || b.created_at) -
        new Date(a.date_commande || a.date || a.created_at)
    );

  // Total d'une commande (multi-lignes)
  const getMontantTotal = (commande) =>
    (commande.lignes || []).reduce(
      (sum, l) => sum + Number(l.prix_unitaire || 0) * Number(l.quantite || 0),
      0
    );

  // Ventes par période
  const getVentesParPeriode = () => {
    const aujourdHui = new Date();
    const result = { jour: 0, semaine: 0, mois: 0, annee: 0 };

    commandesTerminees.forEach((cmd) => {
      const dateCmd = new Date(cmd.date_commande || cmd.date || cmd.created_at);
      const montant = getMontantTotal(cmd);

      if (dateCmd.toDateString() === aujourdHui.toDateString()) {
        result.jour += montant;
      }
      const diffJours = (aujourdHui - dateCmd) / (1000 * 60 * 60 * 24);
      if (diffJours <= 7) result.semaine += montant;

      if (
        dateCmd.getMonth() === aujourdHui.getMonth() &&
        dateCmd.getFullYear() === aujourdHui.getFullYear()
      ) {
        result.mois += montant;
      }
      if (dateCmd.getFullYear() === aujourdHui.getFullYear()) {
        result.annee += montant;
      }
    });

    return result;
  };

  const ventesParPeriode = getVentesParPeriode();

  // Top produits
  const getProduitsPlusVendus = () => {
    const map = new Map();
    commandesTerminees.forEach((cmd) => {
      (cmd.lignes || []).forEach((ligne) => {
        const prod = ligne.produit_detail || {};
        const key = prod.id || prod.nom || 'inconnu';
        if (!map.has(key)) {
          map.set(key, {
            nom: prod.nom || 'Produit inconnu',
            quantite: 0,
            montant: 0,
            commandes: 0,
          });
        }
        const p = map.get(key);
        p.quantite += Number(ligne.quantite || 0);
        p.montant += Number(ligne.prix_unitaire || 0) * Number(ligne.quantite || 0);
        p.commandes += 1;
      });
    });
    return Array.from(map.values()).sort((a, b) => b.montant - a.montant).slice(0, 3);
  };

  const produitsPlusVendus = getProduitsPlusVendus();

  // Clients fidèles
  const getClientsFideles = () => {
    const map = new Map();
    commandesTerminees.forEach((cmd) => {
      const acheteur = cmd.acheteur_detail || {};
      const id = acheteur.id || cmd.acheteur;
      if (!id) return;
      const nom =
        `${acheteur.prenom || ''} ${acheteur.nom || ''}`.trim() || 'Anonyme';
      if (!map.has(id)) {
        map.set(id, {
          nom,
          telephone: acheteur.telephone,
          montant: 0,
          commandes: 0,
        });
      }
      const c = map.get(id);
      c.montant += getMontantTotal(cmd);
      c.commandes += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.montant - a.montant).slice(0, 3);
  };

  const clientsFideles = getClientsFideles();

  if (!estPecheur()) return null;

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        {/* HEADER */}
        <header className="flex shrink-0 items-center justify-between px-5 pt-6 pb-3">
          <h1 className="text-2xl font-extrabold text-[#0C3B4A]">Mes Ventes</h1>
          <button
            onClick={() => navigate('/pecheur/accueil')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm"
          >
            <TrendingUp size={18} />
          </button>
        </header>

        {/* MAIN scrollable */}
        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28 pt-2 space-y-4">

          {/* Chiffre d'affaires */}
          <div className="rounded-3xl bg-[#0C3B4A] p-5 text-white shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  Chiffre d'affaires total
                </p>
                <p className="text-3xl font-black mt-1">
                  {formatPrice(statistiques.ventesTotal)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <TrendingUp size={22} className="text-cyan-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
              <div className="text-center">
                <p className="text-lg font-black">{statistiques.commandesTerminees}</p>
                <p className="text-[10px] text-cyan-200">Commandes livrées</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black">
                  {Number(statistiques.produitsVendus || 0).toFixed(0)} kg
                </p>
                <p className="text-[10px] text-cyan-200">Vendus</p>
              </div>
            </div>
          </div>

          {/* Filtres période */}
          <div className="rounded-2xl bg-white p-2 shadow-sm border border-stone-100 flex gap-1">
            {[
              { id: 'jour', label: "Aujourd'hui" },
              { id: 'semaine', label: 'Semaine' },
              { id: 'mois', label: 'Mois' },
              { id: 'annee', label: 'Année' },
            ].map((tab) => {
              const active = periode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPeriode(tab.id)}
                  className={`flex-1 rounded-xl px-2 py-2 text-[10px] font-bold transition-all ${
                    active
                      ? 'bg-[#0C3B4A] text-white'
                      : 'text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Résumé période */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-3 shadow-sm border border-stone-100">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
              <p className="text-xl font-black text-[#0F2A4A]">
                {formatPrice(ventesParPeriode[periode])}
              </p>
              <p className="text-[10px] text-stone-500 capitalize">
                Ventes {periode}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-sm border border-stone-100">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
                <BarChart3 size={14} className="text-blue-600" />
              </div>
              <p className="text-xl font-black text-[#0F2A4A]">
                {commandesTerminees.length}
              </p>
              <p className="text-[10px] text-stone-500 capitalize">
                Commandes {periode}
              </p>
            </div>
          </div>

          {/* Top produits */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Produits les plus vendus
            </h2>
            {produitsPlusVendus.length > 0 ? (
              produitsPlusVendus.map((produit, index) => (
                <div
                  key={produit.nom}
                  className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B4A] text-xs font-black text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0F2A4A]">
                      {produit.nom}
                    </p>
                    <p className="text-[10px] text-stone-500">
                      {produit.quantite} kg vendus
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#FF6B4A]">
                      {formatPrice(produit.montant)}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {produit.commandes} commandes
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-stone-100 bg-white p-4 text-center">
                <p className="text-xs text-stone-500">Aucun produit vendu</p>
              </div>
            )}
          </div>

          {/* Top clients */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Clients les plus fidèles
            </h2>
            {clientsFideles.length > 0 ? (
              clientsFideles.map((client, index) => (
                <div
                  key={client.nom}
                  className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0C3B4A] text-xs font-black text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0F2A4A]">
                      {client.nom}
                    </p>
                    <p className="text-[10px] text-stone-500">
                      {client.telephone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#FF6B4A]">
                      {formatPrice(client.montant)}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {client.commandes} commandes
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-stone-100 bg-white p-4 text-center">
                <p className="text-xs text-stone-500">Aucun client fidèle</p>
              </div>
            )}
          </div>

          {/* Historique */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Historique des ventes
            </h2>

            {loading ? (
              <div className="py-12 text-center text-sm text-stone-500">
                Chargement...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
                {error}
              </div>
            ) : commandesTerminees.length === 0 ? (
              <div className="rounded-3xl border border-stone-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                  <BarChart3 size={28} className="text-stone-400" />
                </div>
                <h3 className="mb-2 font-bold text-[#0F2A4A]">
                  Aucune vente enregistrée
                </h3>
                <p className="mb-4 text-xs text-stone-500">
                  Vos ventes apparaîtront ici après livraison.
                </p>
                <button
                  onClick={() => navigate('/pecheur/publication/nouvelle')}
                  className="rounded-xl bg-[#FF6B4A] px-5 py-2.5 text-xs font-bold text-white"
                >
                  Publier maintenant
                </button>
              </div>
            ) : (
              commandesTerminees.slice(0, 10).map((cmd) => {
                const montant = getMontantTotal(cmd);
                const premier = cmd.lignes?.[0]?.produit_detail || {};

                return (
                  <div
                    key={cmd.id}
                    className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        {premier.media ? (
                          <img
                            src={premier.media} 
                            alt={premier.nom}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package size={18} className="text-stone-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-[#0F2A4A]">
                          {premier.nom || 'Produit inconnu'}
                          {cmd.lignes?.length > 1 && (
                            <span className="ml-1 text-[10px] font-normal text-stone-400">
                              +{cmd.lignes.length - 1}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs font-bold text-[#FF6B4A]">
                          {formatPrice(montant)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <p className="mt-0.5 text-[9px] text-stone-400">
                          {new Date(cmd.date_commande || cmd.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        <PecheurBottomNav />
      </div>
    </div>
  );
};

export default Ventes;