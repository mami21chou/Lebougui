import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin, Calendar, ArrowLeft, Eye, ShoppingCart, AlertCircle } from 'lucide-react';
import { useCommandes } from '../../context/CommandeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MesCommandes() {
  const navigate = useNavigate();
  const { mesCommandes, chargerMesCommandes } = useCommandes();
  const { estAcheteur, estAuthentifie } = useAuth();

  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/connexion');
      return;
    }

    if (estAuthentifie()) {
      chargerMesCommandes();
      setChargement(false);
    }
  }, [navigate, estAuthentifie, chargerMesCommandes]);

  // Mettre à jour le chargement
  useEffect(() => {
    setChargement(mesCommandes.chargement);
  }, [mesCommandes.chargement]);

  const statuts = [
    { id: 'tous', label: 'Toutes', color: 'gray' },
    { id: 'en_attente_pecheur', label: 'En attente du pêcheur', color: 'warning' },
    { id: 'en_attente_paiement', label: 'En attente de paiement', color: 'info' },
    { id: 'en_recherche_livreur', label: 'En recherche de livreur', color: 'primary' },
    { id: 'en_livraison', label: 'En livraison', color: 'secondary' },
    { id: 'livree', label: 'Livrée', color: 'success' },
    { id: 'annulee', label: 'Annulée', color: 'danger' },
    { id: 'refusee', label: 'Refusée', color: 'danger' },
  ];

  const getStatutLabel = (statut) => {
    const statutObj = statuts.find(s => s.id === statut);
    return statutObj ? statutObj.label : statut;
  };

  const getStatutColor = (statut) => {
    const statutObj = statuts.find(s => s.id === statut);
    return statutObj ? statutObj.color : 'gray';
  };

  const filteredCommandes = mesCommandes.liste.filter(commande => {
    if (filtreStatut === 'tous') return true;
    return commande.statut?.toLowerCase() === filtreStatut?.toLowerCase();
  });

  const formaterPrix = (prix) => {
    return new Intl.NumberFormat('fr-FR').format(prix || 0) + ' FCFA';
  };

  const formaterDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculerTotalCommande = (commande) => {
    if (!commande.lignes) return 0;
    return commande.lignes.reduce((total, ligne) => {
      return total + ((ligne.prix_unitaire || 0) * (ligne.quantite || 0));
    }, 0);
  };

  const getQuantiteTotale = (commande) => {
    if (!commande.lignes) return 0;
    return commande.lignes.reduce((total, ligne) => total + (ligne.quantite || 0), 0);
  };

  const getNombreProduits = (commande) => {
    return commande.lignes ? commande.lignes.length : 0;
  };

  const getIconeStatut = (statut) => {
    switch (statut) {
      case 'en_attente_pecheur':
        return <Clock className="w-4 h-4" />;
      case 'en_attente_paiement':
        return <AlertCircle className="w-4 h-4" />;
      case 'en_recherche_livreur':
        return <Truck className="w-4 h-4" />;
      case 'en_livraison':
        return <Package className="w-4 h-4" />;
      case 'livree':
        return <CheckCircle className="w-4 h-4" />;
      case 'annulee':
      case 'refusee':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="d-flex align-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Mes Commandes
            </h1>
            <p className="text-gray-600">
              Suivez l'état de vos commandes et gérer vos achats
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/acheteur/accueil')}
            className="d-flex align-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Continuer mes achats</span>
          </Button>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="d-flex flex-wrap gap-2">
            {statuts.map(statut => (
              <Button
                key={statut.id}
                variant={filtreStatut === statut.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFiltreStatut(statut.id)}
                className="flex-0"
              >
                {statut.label}
                {mesCommandes.liste.filter(cmd => cmd.statut === statut.id).length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                    {mesCommandes.liste.filter(cmd => cmd.statut === statut.id).length}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md-grid-cols-4 gap-4 mb-6">
          <Card className="border border-gray-100">
            <Card.Body className="p-4 text-center">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-xl d-flex align-center justify-center mx-auto mb-3">
                <Package className="text-primary w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Total</p>
              <p className="font-bold text-gray-900 text-xl">{mesCommandes.liste.length}</p>
            </Card.Body>
          </Card>

          <Card className="border border-gray-100">
            <Card.Body className="p-4 text-center">
              <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-xl d-flex align-center justify-center mx-auto mb-3">
                <Clock className="text-warning w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500 mb-1">En attente</p>
              <p className="font-bold text-gray-900 text-xl">
                {mesCommandes.liste.filter(cmd => 
                  cmd.statut === 'en_attente_pecheur' || cmd.statut === 'en_attente_paiement'
                ).length}
              </p>
            </Card.Body>
          </Card>

          <Card className="border border-gray-100">
            <Card.Body className="p-4 text-center">
              <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-xl d-flex align-center justify-center mx-auto mb-3">
                <Truck className="text-secondary w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500 mb-1">En cours</p>
              <p className="font-bold text-gray-900 text-xl">
                {mesCommandes.liste.filter(cmd => 
                  cmd.statut === 'en_recherche_livreur' || cmd.statut === 'en_livraison'
                ).length}
              </p>
            </Card.Body>
          </Card>

          <Card className="border border-gray-100">
            <Card.Body className="p-4 text-center">
              <div className="w-12 h-12 bg-success bg-opacity-10 rounded-xl d-flex align-center justify-center mx-auto mb-3">
                <CheckCircle className="text-success w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500 mb-1">Terminées</p>
              <p className="font-bold text-gray-900 text-xl">
                {mesCommandes.liste.filter(cmd => cmd.statut === 'livree').length}
              </p>
            </Card.Body>
          </Card>
        </div>

        {/* Liste des commandes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {mesCommandes.chargement ? (
            <div className="d-flex justify-center align-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredCommandes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full d-flex align-center justify-center mx-auto mb-4">
                <Package className="text-gray-400 w-10 h-10" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                {filtreStatut === 'tous' ? 'Aucune commande' : 'Aucune commande avec ce statut'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {filtreStatut === 'tous' 
                  ? 'Vous n\'avez pas encore passé de commande. Explorez notre marché pour découvrir des produits frais!' 
                  : 'Il n\'y a pas de commande avec ce statut pour le moment.'
                }
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/acheteur/accueil')}
              >
                Explorer le marché
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCommandes.map((commande) => (
                <div key={commande.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="d-flex flex-column lg-flex-row gap-4">
                    {/* Image du premier produit */}
                    <div className="flex-0">
                      {commande.lignes && commande.lignes.length > 0 ? (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={commande.lignes[0]?.produit_detail?.media || 
                                 commande.lignes[0]?.produit_detail?.image || 
                                 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=200&auto=format&fit=crop&q=80'}
                            alt={commande.lignes[0]?.produit_detail?.nom}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg d-flex align-center justify-center">
                          <Package className="text-gray-400 w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Détails */}
                    <div className="flex-1">
                      <div className="d-flex flex-column md-flex-row md-justify-between md-align-center gap-2">
                        <div>
                          <div className="d-flex align-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              Commande #{commande.numero || commande.id}
                            </h3>
                            <Badge variant={getStatutColor(commande.statut)} size="sm">
                              {getStatutLabel(commande.statut)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {getNombreProduits(commande)} produit(s) - {getQuantiteTotale(commande)} kg
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary text-lg">
                            {formaterPrix(calculerTotalCommande(commande))}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex align-center gap-4 text-sm text-gray-600 mt-3">
                        <div className="d-flex align-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formaterDate(commande.date_commande)}</span>
                        </div>
                        <div className="d-flex align-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{commande.adresse_livraison || 'Adresse non spécifiée'}</span>
                        </div>
                        <div className="d-flex align-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{commande.nom_pecheur || 'Pêcheur'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-0 d-flex align-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/acheteur/commande/${commande.id}`)}
                        className="d-flex align-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="d-none md-d-inline">Voir</span>
                      </Button>

                      {commande.statut === 'en_attente_paiement' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/acheteur/paiement/${commande.id}`)}
                        >
                          Payer
                        </Button>
                      )}

                      {['en_attente_pecheur', 'en_attente_paiement'].includes(commande.statut) && (
                        <Button
                          variant="danger-outline"
                          size="sm"
                          onClick={() => navigate(`/acheteur/commande/${commande.id}/annuler`)}
                        >
                          Annuler
                        </Button>
                      )}

                      {commande.statut === 'en_livraison' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/acheteur/suivi-livraison/${commande.id}`)}
                          className="d-flex align-center gap-1"
                        >
                          <Truck className="w-4 h-4" />
                          <span className="d-none md-d-inline">Suivre</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Produits de la commande (mobile) */}
                  <div className="mt-3 d-flex gap-2 lg-d-none">
                    {commande.lignes?.slice(0, 2).map((ligne, index) => (
                      <div
                        key={index}
                        className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden"
                        title={ligne.produit_detail?.nom}
                      >
                        <img
                          src={ligne.produit_detail?.media || ligne.produit_detail?.image || 
                               'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=100&auto=format&fit=crop&q=80'}
                          alt={ligne.produit_detail?.nom}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {commande.lignes && commande.lignes.length > 2 && (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg d-flex align-center justify-center">
                        <span className="text-xs text-gray-500">+{commande.lignes.length - 2}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
