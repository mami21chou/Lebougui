import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Clock, Truck, Package, CheckCircle, User, Phone, Star, ArrowLeft, RefreshCw, Compass } from 'lucide-react';
import { useCommandes } from '../../context/CommandeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function SuiviLivraison() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { mesCommandes, chargerMesCommandes } = useCommandes();
  const { estAuthentifie } = useAuth();

  const [commande, setCommande] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [progression, setProgression] = useState(0);

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

  useEffect(() => {
    if (mesCommandes.liste.length > 0 && id) {
      const foundCommande = mesCommandes.liste.find(cmd => cmd.id == id);
      if (foundCommande) {
        setCommande(foundCommande);
        calculerProgression(foundCommande);
      }
      setChargement(false);
    }
  }, [id, mesCommandes.liste]);

  const calculerProgression = (cmd) => {
    const statut = cmd.statut || '';
    let valeur = 0;
    
    switch (statut.toLowerCase()) {
      case 'en_attente_pecheur':
        valeur = 10;
        break;
      case 'en_attente_paiement':
        valeur = 30;
        break;
      case 'en_recherche_livreur':
        valeur = 50;
        break;
      case 'en_livraison':
        valeur = 80;
        break;
      case 'livree':
        valeur = 100;
        break;
      default:
        valeur = 0;
    }
    
    setProgression(valeur);
  };

  const formaterDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formaterPrix = (prix) => {
    return new Intl.NumberFormat('fr-FR').format(prix || 0) + ' FCFA';
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'en_attente_pecheur': return 'En attente du pêcheur';
      case 'en_attente_paiement': return 'En attente de paiement';
      case 'en_recherche_livreur': return 'En recherche de livreur';
      case 'en_livraison': return 'En livraison';
      case 'livree': return 'Livrée';
      case 'annulee': return 'Annulée';
      case 'refusee': return 'Refusée';
      default: return statut;
    }
  };

  const getEtapeActuelle = () => {
    const statut = commande?.statut || '';
    
    switch (statut.toLowerCase()) {
      case 'en_attente_pecheur': return 1;
      case 'en_attente_paiement': return 2;
      case 'en_recherche_livreur': return 3;
      case 'en_livraison': return 4;
      case 'livree': return 5;
      default: return 0;
    }
  };

  const etapes = [
    { id: 1, label: 'Confirmation par le pêcheur', icon: <User className="w-6 h-6" />, date: commande?.date_commande },
    { id: 2, label: 'Paiement validé', icon: <CheckCircle className="w-6 h-6" />, date: commande?.date_paiement },
    { id: 3, label: 'Livreur assigné', icon: <Truck className="w-6 h-6" />, date: commande?.date_recherche_livreur },
    { id: 4, label: 'En route pour la livraison', icon: <Compass className="w-6 h-6" />, date: commande?.date_en_livraison },
    { id: 5, label: 'Livraison terminée', icon: <Package className="w-6 h-6" />, date: commande?.date_livraison },
  ];

  const calculerTotal = () => {
    if (!commande?.lignes) return 0;
    return commande.lignes.reduce((total, ligne) => {
      return total + ((ligne.prix_unitaire || 0) * (ligne.quantite || 0));
    }, 0);
  };

  if (chargement) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] d-flex align-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] p-4 md:p-6">
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full d-flex align-center justify-center mx-auto mb-4">
            <Package className="text-gray-400 w-10 h-10" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Commande non trouvée</h3>
          <p className="text-gray-600 text-sm mb-4">
            La commande que vous cherchez n'existe pas ou n'est pas accessible
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/acheteur/commandes')}
          >
            Retour à mes commandes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="d-flex align-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="d-flex align-center gap-2 bg-white border-none p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-800">Retour</span>
          </button>
        </div>

        {/* Titre */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Suivi de la livraison
          </h1>
          <p className="text-gray-600">
            Commande #{commande.numero || commande.id}
          </p>
        </div>

        {/* Statut actuel */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="d-flex flex-column md-flex-row gap-6">
            <div className="flex-1">
              <div className="d-flex align-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-primary bg-opacity-10 d-flex align-center justify-center">
                  {getEtapeActuelle() === 5 ? (
                    <CheckCircle className="text-primary w-7 h-7" />
                  ) : (
                    <Truck className="text-primary w-7 h-7" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {getStatutLabel(commande.statut)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getEtapeActuelle() < 5 
                      ? 'Votre commande est en cours de traitement' 
                      : 'Votre commande a été livrée avec succès!'}
                  </p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mb-4">
                <div className="d-flex justify-between text-xs text-gray-500 mb-2">
                  <span>0%</span>
                  <span>100%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-primary transition-all duration-500`}
                    style={{ width: `${progression}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Progression: {progression}%
                </p>
              </div>

              {/* Détails de la livraison */}
              <div className="grid grid-cols-1 md-grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Livreur</p>
                  <p className="font-medium text-gray-900">
                    {commande.livraison?.nom_livreur || commande.livreur?.nom || 'Non assigné'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                  <p className="font-medium text-gray-900">
                    {commande.livraison?.telephone || commande.livreur?.telephone || 'Non disponible'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date estimée</p>
                  <p className="font-medium text-gray-900">
                    {commande.date_livraison 
                      ? formaterDate(commande.date_livraison) 
                      : 'À déterminer'}
                  </p>
                </div>
              </div>
            </div>

            {/* Résumé de la commande */}
            <div className="flex-0 md-w-300">
              <Card className="border border-gray-100">
                <Card.Body className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Résumé de la commande
                  </h4>
                  <div className="space-y-3">
                    <div className="d-flex justify-between">
                      <span className="text-sm text-gray-600">
                        {commande.lignes?.length || 0} produit(s)
                      </span>
                      <span className="font-medium text-gray-900">
                        {formaterPrix(calculerTotal())}
                      </span>
                    </div>
                    <div className="d-flex justify-between">
                      <span className="text-sm text-gray-600">Frais de livraison</span>
                      <span className="font-medium text-gray-900">
                        {formaterPrix(commande.frais_livraison || 0)}
                      </span>
                    </div>
                    <div className="d-flex justify-between pt-2 border-top border-gray-100">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-primary">
                        {formaterPrix(calculerTotal() + (commande.frais_livraison || 0))}
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>

        {/* Étapes de livraison */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg mb-6">
            Étapes de la livraison
          </h2>
          <div className="d-flex flex-column gap-4">
            {etapes.map((etape, index) => {
              const estTerminee = etape.id < getEtapeActuelle();
              const estActuelle = etape.id === getEtapeActuelle();
              const estAVenir = etape.id > getEtapeActuelle();

              return (
                <div
                  key={etape.id}
                  className={`d-flex gap-4 p-4 rounded-lg transition ${
                    estTerminee 
                      ? 'bg-green-50 border border-green-200' 
                      : estActuelle 
                        ? 'bg-primary bg-opacity-5 border border-primary' 
                        : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex-0 d-flex align-center justify-center">
                    <div className={`w-10 h-10 rounded-full d-flex align-center justify-center ${
                      estTerminee 
                        ? 'bg-green-500' 
                        : estActuelle 
                          ? 'bg-primary' 
                          : 'bg-gray-300'
                    }`}>
                      {React.cloneElement(etape.icon, {
                        className: `w-5 h-5 ${estTerminee ? 'text-white' : estActuelle ? 'text-white' : 'text-gray-600'}`
                      })}
                    </div>
                    {index < etapes.length - 1 && (
                      <div className={`w-1 h-8 mx-2 ${
                        estTerminee ? 'bg-green-500' : estActuelle ? 'bg-primary' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${
                      estTerminee ? 'text-green-700' : estActuelle ? 'text-primary' : 'text-gray-500'
                    }`}>
                      {etape.label}
                    </h3>
                    {etape.date && (
                      <p className="text-sm text-gray-600">
                        {formaterDate(etape.date)}
                      </p>
                    )}
                    {estTerminee && (
                      <p className="text-xs text-green-600 mt-1">
                        Terminé
                      </p>
                    )}
                    {estActuelle && (
                      <p className="text-xs text-primary mt-1">
                        En cours
                      </p>
                    )}
                    {estAVenir && (
                      <p className="text-xs text-gray-500 mt-1">
                        En attente
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="grid grid-cols-1 lg-grid-cols-2 gap-6 mb-6">
          {/* Informations de la commande */}
          <Card className="border border-gray-100">
            <Card.Body className="p-4">
              <h3 className="font-bold text-gray-900 mb-4">
                Informations de la commande
              </h3>
              <div className="space-y-3">
                <div className="d-flex align-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full d-flex align-center justify-center">
                    <Package className="text-gray-500 w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Numéro de commande</p>
                    <p className="font-medium text-gray-900">#{commande.numero || commande.id}</p>
                  </div>
                </div>
                <div className="d-flex align-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full d-flex align-center justify-center">
                    <Calendar className="text-gray-500 w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de commande</p>
                    <p className="font-medium text-gray-900">
                      {formaterDate(commande.date_commande)}
                    </p>
                  </div>
                </div>
                <div className="d-flex align-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full d-flex align-center justify-center">
                    <MapPin className="text-gray-500 w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Adresse de livraison</p>
                    <p className="font-medium text-gray-900">
                      {commande.adresse_livraison || 'Non spécifiée'}
                    </p>
                  </div>
                </div>
                <div className="d-flex align-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full d-flex align-center justify-center">
                    <User className="text-gray-500 w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pêcheur</p>
                    <p className="font-medium text-gray-900">
                      {commande.nom_pecheur || 'Non spécifié'}
                    </p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Produits commandés */}
          <Card className="border border-gray-100">
            <Card.Body className="p-4">
              <h3 className="font-bold text-gray-900 mb-4">
                Produits commandés ({commande.lignes?.length || 0})
              </h3>
              <div className="space-y-3">
                {commande.lignes?.map((ligne, index) => (
                  <div key={index} className="d-flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-0">
                      <img
                        src={ligne.produit_detail?.media || ligne.produit_detail?.image || 
                             'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=100&auto=format&fit=crop&q=80'}
                        alt={ligne.produit_detail?.nom}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{ligne.produit_detail?.nom || 'Produit inconnu'}</p>
                      <p className="text-sm text-gray-500">
                        {ligne.quantite} kg × {formaterPrix(ligne.prix_unitaire)}
                      </p>
                    </div>
                    <div className="flex-0 text-right">
                      <p className="font-semibold text-primary">
                        {formaterPrix(ligne.sous_total || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="d-flex flex-wrap gap-4 justify-center md-justify-start">
            <Button
              variant="primary"
              onClick={() => navigate(`/acheteur/commandes`)}
              className="d-flex align-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à mes commandes</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                window.location.reload();
              }}
              className="d-flex align-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser</span>
            </Button>

            {commande.statut === 'livree' && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/acheteur/note/${commande.id}`)}
                className="d-flex align-center gap-2"
              >
                <Star className="w-4 h-4" />
                <span>Noter le pêcheur</span>
              </Button>
            )}

            {commande.livraison && (
              <Button
                variant="outline-secondary"
                onClick={() => navigate(`/acheteur/itineraire/${commande.livraison?.id || commande.id}`)}
                className="d-flex align-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Voir l'itinéraire</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
