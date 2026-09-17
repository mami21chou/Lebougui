import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, MapPin, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommandes } from '../../context/CommandeContext';

const CommandesRecues = () => {
  const { utilisateur, estPecheur } = useAuth();
  const { mesCommandes, chargerMesCommandes, mettreAJourStatutCommande } = useCommandes();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError('Impossible de charger vos commandes');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [estPecheur, chargerMesCommandes, navigate]);

  // Filtrer par statut
  const [filtreStatut, setFiltreStatut] = useState('toutes'); // 'toutes', 'en_attente', 'en_cours', 'terminee', 'annulee'

  const getFilteredCommandes = () => {
    if (filtreStatut === 'toutes') {
      return mesCommandes.liste
        .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
    }
    return mesCommandes.liste
      .filter(cmd => cmd.statut?.toLowerCase() === filtreStatut)
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  };

  const commandes = getFilteredCommandes();

  const getStatutLabel = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'en_attente':
        return { label: 'En attente', color: 'bg-amber-50 text-amber-700', icon: Clock };
      case 'en_cours':
        return { label: 'En cours', color: 'bg-blue-50 text-blue-700', icon: AlertTriangle };
      case 'terminee':
        return { label: 'Terminée', color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 };
      case 'annulee':
        return { label: 'Annulée', color: 'bg-red-50 text-red-700', icon: XCircle };
      default:
        return { label: statut || 'Inconnu', color: 'bg-slate-50 text-slate-700', icon: AlertTriangle };
    }
  };

  const handleChangerStatut = async (commandeId, nouveauStatut) => {
    try {
      const result = await mettreAJourStatutCommande(commandeId, nouveauStatut);
      if (result.success) {
        await chargerMesCommandes();
      }
    } catch (err) {
      console.error('Erreur de mise à jour:', err);
      setError('Impossible de mettre à jour la commande');
    }
  };

  const getMontantTotal = (commande) => {
    const prix = commande.produit?.prix || 0;
    const quantite = commande.quantite || 0;
    return prix * quantite;
  };

  // Calculer le total des ventes
  const totalVentes = commandes
    .filter(cmd => cmd.statut?.toLowerCase() === 'terminee')
    .reduce((sum, cmd) => sum + getMontantTotal(cmd), 0);

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
          <h1 className="text-lg font-bold text-slate-900">Commandes reçues</h1>
          <p className="text-xs text-slate-500">Gérer vos demandes clients</p>
        </div>

        <button
          onClick={() => navigate('/pecheur/accueil')}
          className="p-2.5 rounded-full bg-primary text-white shadow-sm shadow-primary/25"
        >
          <Package size={18} />
        </button>
      </header>

      {/* Résumé */}
      <div className="px-5 mb-4">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/25">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-xs opacity-80">Total des ventes</p>
              <p className="text-2xl font-bold">{totalVentes.toLocaleString()} FCFA</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl d-flex align-center justify-center">
              <Package size={24} />
            </div>
          </div>
          <p className="text-xs opacity-80">
            {commandes.filter(cmd => cmd.statut?.toLowerCase() === 'terminee').length} commandes terminées
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200/60 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setFiltreStatut('toutes')}
            className={`flex-0 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filtreStatut === 'toutes' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            TOUTES
          </button>
          <button
            onClick={() => setFiltreStatut('en_attente')}
            className={`flex-0 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filtreStatut === 'en_attente' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            EN ATTENTE
          </button>
          <button
            onClick={() => setFiltreStatut('en_cours')}
            className={`flex-0 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filtreStatut === 'en_cours' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            EN COURS
          </button>
          <button
            onClick={() => setFiltreStatut('terminee')}
            className={`flex-0 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filtreStatut === 'terminee' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            TERMINÉES
          </button>
        </div>
      </div>

      {/* Liste des commandes */}
      <main className="px-5 space-y-4 flex-1">
        {loading ? (
          <div className="flex-1 d-flex align-center justify-center">
            <div className="text-center">
              <p className="text-slate-500 text-sm">Chargement...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <AlertTriangle size={20} className="text-red-500 mx-auto mb-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : commandes.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200/60">
            <div className="w-16 h-16 bg-slate-100 rounded-full d-flex align-center justify-center mx-auto mb-4">
              <Package size={28} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Aucune commande reçue</h3>
            <p className="text-xs text-slate-500 mb-4">
              Publiez vos prises pour recevoir des commandes des acheteurs.
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
            {commandes.map((cmd) => {
              const statutInfo = getStatutLabel(cmd.statut);
              const StatutIcon = statutInfo.icon;
              const montant = getMontantTotal(cmd);

              return (
                <div
                  key={cmd.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/60"
                >
                  {/* En-tête avec statut */}
                  <div className={`p-3 flex justify-between items-center ${statutInfo.color.replace('text-', '').replace('bg-', 'border-')}`}>
                    <div className="flex items-center gap-2">
                      <StatutIcon size={16} className={statutInfo.color.split(' ')[1]} />
                      <span className={`text-xs font-bold ${statutInfo.color.split(' ')[1]}`}>
                        {statutInfo.label}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      #{cmd.id}
                    </span>
                  </div>

                  {/* Contenu */}
                  <div className="p-3 space-y-2">
                    {/* Produit */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-0">
                        {cmd.produit?.media ? (
                          <img
                            src={cmd.produit.media}
                            alt={cmd.produit.nom}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={20} className="text-slate-400 mx-auto my-2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 text-ellipsis">
                          {cmd.produit?.nom || 'Produit inconnu'}
                        </h4>
                        <p className="text-xs text-orange-500 font-bold">
                          {cmd.produit?.prix || 0} FCFA/kg
                        </p>
                      </div>
                    </div>

                    {/* Détails de la commande */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin size={12} />
                        <span className="text-ellipsis">{cmd.produit?.adresse || 'Localisation inconnue'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500">Quantité:</span>
                        <span className="font-bold text-slate-800"> {cmd.quantite} kg</span>
                      </div>
                    </div>

                    {/* Client */}
                    {cmd.acheteur && (
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">Client:</span> {cmd.acheteur.prenom} {cmd.acheteur.nom}
                        </p>
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">Téléphone:</span> {cmd.acheteur.telephone}
                        </p>
                      </div>
                    )}

                    {/* Total */}
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                      <p className="text-xs text-slate-500">Date de commande:</p>
                      <p className="text-sm font-bold text-orange-500">
                        {montant.toLocaleString()} FCFA
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-400">
                      {new Date(cmd.date || cmd.created_at).toLocaleDateString('fr-FR')} à {new Date(cmd.date || cmd.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Actions */}
                  {cmd.statut?.toLowerCase() === 'en_attente' && (
                    <div className="p-2 border-t border-slate-100 flex gap-2 bg-slate-50">
                      <button
                        onClick={() => handleChangerStatut(cmd.id, 'en_cours')}
                        className="flex-1 py-2 px-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                      >
                        <CheckCircle2 size={14} className="inline mr-1" />
                        Accepter
                      </button>
                      <button
                        onClick={() => handleChangerStatut(cmd.id, 'annulee')}
                        className="py-2 px-3 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                  
                  {cmd.statut?.toLowerCase() === 'en_cours' && (
                    <div className="p-2 border-t border-slate-100 flex gap-2 bg-slate-50">
                      <button
                        onClick={() => handleChangerStatut(cmd.id, 'terminee')}
                        className="flex-1 py-2 px-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                      >
                        <CheckCircle2 size={14} className="inline mr-1" />
                        Marquer terminée
                      </button>
                      <button
                        onClick={() => handleChangerStatut(cmd.id, 'annulee')}
                        className="py-2 px-3 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
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
        <button onClick={() => navigate('/pecheur/commandes')} className="flex flex-col items-center gap-1 text-orange-500 font-bold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
          </svg>
          <span className="text-[9px]">Commandes</span>
        </button>
        <button onClick={() => navigate('/pecheur/ventes')} className="flex flex-col items-center gap-1 hover:text-orange-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[9px]">Ventes</span>
        </button>
      </nav>
    </div>
  );
};

export default CommandesRecues;
