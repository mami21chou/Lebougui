import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, MapPin, Calendar, TrendingUp, TrendingDown, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommandes } from '../../context/CommandeContext';

const Ventes = () => {
  const { utilisateur, estPecheur } = useAuth();
  const { mesCommandes, chargerMesCommandes, getStatistiquesPêcheur } = useCommandes();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periode, setPeriode] = useState('mois'); // 'jour', 'semaine', 'mois', 'annee'

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

  // Filtrer les commandes terminées
  const commandesTerminees = mesCommandes.liste
    .filter(cmd => cmd.statut?.toLowerCase() === 'terminee')
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

  const getMontantTotal = (commande) => {
    const prix = commande.produit?.prix || 0;
    const quantite = commande.quantite || 0;
    return prix * quantite;
  };

  // Calculer les ventes par période
  const getVentesParPeriode = () => {
    const aujourdHui = new Date();
    const result = {
      aujourdHui: 0,
      semaine: 0,
      mois: 0,
      annee: 0,
    };

    commandesTerminees.forEach(cmd => {
      const dateCmd = new Date(cmd.date || cmd.created_at);
      const montant = getMontantTotal(cmd);

      // Aujourd'hui
      if (dateCmd.toDateString() === aujourdHui.toDateString()) {
        result.aujourdHui += montant;
      }

      // Cette semaine
      const diffJours = (aujourdHui - dateCmd) / (1000 * 60 * 60 * 24);
      if (diffJours <= 7) {
        result.semaine += montant;
      }

      // Ce mois
      if (dateCmd.getMonth() === aujourdHui.getMonth() && dateCmd.getFullYear() === aujourdHui.getFullYear()) {
        result.mois += montant;
      }

      // Cette année
      if (dateCmd.getFullYear() === aujourdHui.getFullYear()) {
        result.annee += montant;
      }
    });

    return result;
  };

  const ventesParPeriode = getVentesParPeriode();

  // Produits les plus vendus
  const getProduitsPlusVendus = () => {
    const produitsMap = new Map();
    
    commandesTerminees.forEach(cmd => {
      const produitId = cmd.produit?.id || cmd.produit?.nom;
      const produitNom = cmd.produit?.nom || 'Inconnu';
      const quantite = cmd.quantite || 0;
      const montant = getMontantTotal(cmd);

      if (!produitsMap.has(produitId)) {
        produitsMap.set(produitId, {
          nom: produitNom,
          quantite: 0,
          montant: 0,
          commandes: 0,
        });
      }

      const produit = produitsMap.get(produitId);
      produit.quantite += quantite;
      produit.montant += montant;
      produit.commandes += 1;
    });

    return Array.from(produitsMap.values())
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 3);
  };

  const produitsPlusVendus = getProduitsPlusVendus();

  // Client les plus fidèles
  const getClientsFideles = () => {
    const clientsMap = new Map();
    
    commandesTerminees.forEach(cmd => {
      if (!cmd.acheteur) return;
      
      const clientId = cmd.acheteur.id;
      const clientNom = `${cmd.acheteur.prenom || ''} ${cmd.acheteur.nom || ''}`.trim() || 'Anonyme';
      const montant = getMontantTotal(cmd);

      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          nom: clientNom,
          telephone: cmd.acheteur.telephone,
          montant: 0,
          commandes: 0,
        });
      }

      const client = clientsMap.get(clientId);
      client.montant += montant;
      client.commandes += 1;
    });

    return Array.from(clientsMap.values())
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 3);
  };

  const clientsFideles = getClientsFideles();

  if (!estPecheur()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-slate-800 font-sans pb-28 max-w-md mx-auto shadow-2xl relative">
      {/* Header */}
      <header className="p-5 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full bg-white shadow-sm border border-slate-200/80"
        >
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-bold text-slate-900">Mes ventes</h1>
          <p className="text-xs text-slate-500">Statistiques et historique</p>
        </div>

        <button
          onClick={() => navigate('/pecheur/accueil')}
          className="p-2.5 rounded-full bg-primary text-white shadow-sm shadow-primary/25"
        >
          <TrendingUp size={18} />
        </button>
      </header>

      {/* Statistiques globales */}
      <div className="px-5 mb-4">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/25">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-xs opacity-80">Chiffre d'affaires total</p>
              <p className="text-2xl font-bold">{statistiques.ventesTotal.toLocaleString()} FCFA</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl d-flex align-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="font-bold">{statistiques.commandesTerminees}</p>
              <p className="opacity-80">Commandes</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="font-bold">{statistiques.produitsVendus} kg</p>
              <p className="opacity-80">Vendus</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtre période */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200/60 flex gap-1">
          <button
            onClick={() => setPeriode('jour')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              periode === 'jour' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            AUJOURD'HUI
          </button>
          <button
            onClick={() => setPeriode('semaine')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              periode === 'semaine' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            SEMAINE
          </button>
          <button
            onClick={() => setPeriode('mois')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              periode === 'mois' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            MOIS
          </button>
          <button
            onClick={() => setPeriode('annee')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              periode === 'annee' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            ANNÉE
          </button>
        </div>
      </div>

      {/* Ventes par période */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-xl d-flex align-center justify-center">
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{ventesParPeriode[periode].toLocaleString()} FCFA</p>
            <p className="text-xs text-slate-500">Ventes {periode}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-xl d-flex align-center justify-center">
                <BarChart3 size={16} className="text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{commandesTerminees.length}</p>
            <p className="text-xs text-slate-500">Commandes {periode}</p>
          </div>
        </div>
      </div>

      {/* Top produits */}
      <div className="px-5 mb-4">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Produits les plus vendus</h2>
        <div className="space-y-2">
          {produitsPlusVendus.length > 0 ? (
            produitsPlusVendus.map((produit, index) => (
              <div
                key={produit.nom}
                className="bg-white rounded-xl p-3 shadow-sm border border-slate-200/60 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full d-flex align-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 text-ellipsis">{produit.nom}</p>
                  <p className="text-xs text-slate-500">{produit.quantite} kg vendus</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-500">{produit.montant.toLocaleString()} FCFA</p>
                  <p className="text-xs text-slate-400">{produit.commandes} commandes</p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl p-4 text-center text-slate-500 text-sm">
              Aucun produit vendu
            </div>
          )}
        </div>
      </div>

      {/* Top clients */}
      <div className="px-5 mb-4">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Clients les plus fidèles</h2>
        <div className="space-y-2">
          {clientsFideles.length > 0 ? (
            clientsFideles.map((client, index) => (
              <div
                key={client.nom}
                className="bg-white rounded-xl p-3 shadow-sm border border-slate-200/60 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-primary text-white rounded-full d-flex align-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 text-ellipsis">{client.nom}</p>
                  <p className="text-xs text-slate-500">{client.telephone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-500">{client.montant.toLocaleString()} FCFA</p>
                  <p className="text-xs text-slate-400">{client.commandes} commandes</p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl p-4 text-center text-slate-500 text-sm">
              Aucun client fidèle
            </div>
          )}
        </div>
      </div>

      {/* Historique complet */}
      <main className="px-5 space-y-4 flex-1">
        <h2 className="text-sm font-bold text-slate-800">Historique des ventes</h2>
        
        {loading ? (
          <div className="flex-1 d-flex align-center justify-center">
            <p className="text-slate-500 text-sm">Chargement...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : commandesTerminees.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200/60">
            <div className="w-16 h-16 bg-slate-100 rounded-full d-flex align-center justify-center mx-auto mb-4">
              <BarChart3 size={28} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Aucune vente enregistrée</h3>
            <p className="text-xs text-slate-500 mb-4">
              Vous n'avez pas encore de ventes.
            </p>
            <button
              onClick={() => navigate('/pecheur/publication/nouvelle')}
              className="py-2 px-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25"
            >
              Publier maintenant
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {commandesTerminees.slice(0, 10).map((cmd) => {
              const montant = getMontantTotal(cmd);

              return (
                <div
                  key={cmd.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/60"
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden flex-0">
                      {cmd.produit?.media ? (
                        <img
                          src={cmd.produit.media}
                          alt={cmd.produit.nom}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={18} className="text-slate-400 mx-auto my-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 text-ellipsis">
                        {cmd.produit?.nom || 'Produit inconnu'}
                      </h4>
                      <p className="text-xs text-orange-500 font-bold">
                        {montant.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="text-right">
                      <CheckCircle2 size={16} className="text-emerald-500 mb-1" />
                      <p className="text-[9px] text-slate-400">
                        {new Date(cmd.date || cmd.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Navigation Bottom */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200/80 px-6 py-3 flex justify-between items-center text-slate-400">
        <button onClick={() => navigate('/pecheur/accueil')} className="flex flex-col items-center gap-1 hover:text-orange-500">
          <Package size={18} />
          <span className="text-[9px]">Publications</span>
        </button>
        <button onClick={() => navigate('/pecheur/commandes')} className="flex flex-col items-center gap-1 hover:text-orange-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
          </svg>
          <span className="text-[9px]">Commandes</span>
        </button>
        <button onClick={() => navigate('/pecheur/ventes')} className="flex flex-col items-center gap-1 text-orange-500 font-bold">
          <TrendingUp size={18} />
          <span className="text-[9px]">Ventes</span>
        </button>
      </nav>
    </div>
  );
};

export default Ventes;
