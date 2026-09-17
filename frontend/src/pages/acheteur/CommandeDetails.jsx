import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, MapPin, Clock, User, Phone, ArrowLeft, CheckCircle, XCircle, AlertCircle, Truck, Calendar, Star, MessageSquare, Printer, Share2, Compass } from 'lucide-react';
import { useCommandes } from '../../context/CommandeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CommandeDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { mesCommandes, chargerMesCommandes, annulerCommande } = useCommandes();
  const { estAuthentifie } = useAuth();

  const [commande, setCommande] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);

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
      }
      setChargement(false);
    }
  }, [id, mesCommandes.liste]);

  const formaterPrix = (prix) => {
    return new Intl.NumberFormat('fr-FR').format(prix || 0) + ' FCFA';
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

  const calculerTotal = () => {
    if (!commande?.lignes) return 0;
    return commande.lignes.reduce((total, ligne) => {
      return total + ((ligne.prix_unitaire || 0) * (ligne.quantite || 0));
    }, 0);
  };

  const calculerQuantiteTotale = () => {
    if (!commande?.lignes) return 0;
    return commande.lignes.reduce((total, ligne) => total + (ligne.quantite || 0), 0);
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

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'en_attente_pecheur':
      case 'en_attente_paiement':
        return 'warning';
      case 'en_recherche_livreur':
      case 'en_livraison':
        return 'secondary';
      case 'livree':
        return 'success';
      case 'annulee':
      case 'refusee':
        return 'danger';
      default:
        return 'gray';
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'en_attente_pecheur':
      case 'en_attente_paiement':
        return <Clock className="w-6 h-6" />;
      case 'en_recherche_livreur':
        return <Truck className="w-6 h-6" />;
      case 'en_livraison':
        return <Package className="w-6 h-6" />;
      case 'livree':
        return <CheckCircle className="w-6 h-6" />;
      case 'annulee':
      case 'refusee':
        return <XCircle className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  const handleAnnulerCommande = async () => {
    if (window.confirm('Voulez-vous vraiment annuler cette commande?')) {
      setChargement(true);
      setErreur(null);

      try {
        // Appeler l'API pour annuler la commande
        // Note: Cela devrait être géré par le backend via une action spécifique
        const result = await annulerCommande(id);
        
        if (result.success) {
          setSucces('Votre commande a été annulée avec succès');
          setCommande({ ...commande, statut: 'annulee' });
          setTimeout(() => {
            navigate('/acheteur/commandes');
          }, 2000);
        } else {
          setErreur(result.error || 'Erreur lors de l\'annulation de la commande');
        }
      } catch (err) {
        setErreur(err.message || 'Une erreur est survenue');
      } finally {
        setChargement(false);
      }
    }
  };

  const handleContacterPecheur = () => {
    if (commande?.pecheur?.telephone) {
      window.location.href = `tel:${commande.pecheur.telephone}`;
    }
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

        {/* Messages */}
        {erreur && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 d-flex align-center gap-3">
            <XCircle className="text-red-500 w-5 h-5 flex-0" />
            <p className="text-red-700 flex-1">{erreur}</p>
            <button
              onClick={() => setErreur(null)}
              className="bg-transparent border-none text-red-500 cursor-pointer hover:text-red-700"
            >
              Fermer
            </button>
          </div>
        )}

        {succes && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 d-flex align-center gap-3">
            <CheckCircle className="text-green-500 w-5 h-5 flex-0" />
            <p className="text-green-700 flex-1">{succes}</p>
          </div>
        )}

        {/* Titre et statut */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="d-flex flex-column md-flex-row gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Commande #{commande.numero || commande.id}
              </h1>
              <div className="d-flex align-center gap-3">
                <Badge variant={getStatutColor(commande.statut)} size="sm">
                  {getStatutLabel(commande.statut)}
                </Badge>
                <span className="text-sm text-gray-500">
                  {formaterDate(commande.date_commande)}
                </span>
              </div>
            </div>
            <div className="flex-0">
              <div className="w-20 h-20 rounded-full d-flex align-center justify-center {
                commande.statut === 'livree' ? 'bg-success bg-opacity-10' :
                ['en_attente_pecheur', 'en_attente_paiement'].includes(commande.statut) ? 'bg-warning bg-opacity-10' :
                'bg-secondary bg-opacity-10'
              }">
                {getStatutIcon(commande.statut)}
              </div>
            </div>
          </div>
        </div>

        {/* Résumé de la commande */}
        <div className="grid grid-cols-1 lg-grid-cols-3 gap-6 mb-6">
          {/* Informations principales */}
          <Card className="border border-gray-100">
            <Card.Body className="p-4">
              <h3 className="font-bold text-gray-900 mb-4">
                Informations de la commande
              </h3>
              <div className="space-y-4">
                <div className="d-flex align-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full d-flex align-center justify-center">
                    <Calendar className="text-gray-500 w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de commande</p>
                    <p className="font-medium text-gray-900">{formaterDate(commande.date_commande)}</p>
                  </div>
                </div>
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
                    <MapPin className="text-gray-500 w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Adresse de livraison</p>
                    <p className="font-medium text-gray-900 text-ellipsis">
                      {commande.adresse_livraison || 'Non spécifiée'}
                    </p>
                  </div>
                </div>
                {commande.frais_livraison > 0 && (
                  <div className="d-flex align-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full d-flex align-center justify-center">
                      <Truck className="text-gray-500 w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Frais de livraison</p>
                      <p className="font-medium text-gray-900">{formaterPrix(commande.frais_livraison)}</p>
                    </div>
                  </div>
                )}
                {commande.distance_km && (
                  <div className="d-flex align-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full d-flex align-center justify-center">
                      <Compass className="text-gray-500 w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Distance</p>
                      <p className="font-medium text-gray-900">{commande.distance_km} km</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Informations du pêcheur */}
          <Card className="border border-gray-100">
            <Card.Body className="p-4">
              <h3 className="font-bold text-gray-900 mb-4">
                Informations du pêcheur
              </h3>
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full d-flex align-center justify-center mx-auto mb-4 overflow-hidden">
                  {commande.pecheur?.photo ? (
                    <img
                      src={commande.pecheur.photo}
                      alt={commande.nom_pecheur}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-gray-500 w-10 h-10" />
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {commande.nom_pecheur || 'Pêcheur inconnu'}
                </h4>
                <p className="text-sm text-gray-500 mb-4">Pêcheur professionnel</p>
                
                <div className="space-y-3">
                  <div className="d-flex align-center gap-2 bg-gray-50 p-2 rounded-lg">
                    <Phone className="text-gray-400 w-4 h-4" />
                    <span className="text-sm text-gray-700">{commande.pecheur?.telephone || 'Non disponible'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleContacterPecheur}
                    disabled={!commande.pecheur?.telephone}
                    className="w-full d-flex align-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Contacter</span>
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Résumé financier */}
          <Card className="border border-primary bg-primary bg-opacity-5">
            <Card.Body className="p-4">
              <h3 className="font-bold text-gray-900 mb-4">
                Résumé financier
              </h3>
              <div className="space-y-3">
                <div className="d-flex justify-between">
                  <span className="text-sm text-gray-600">Sous-total</span>
                  <span className="font-medium text-gray-900">
                    {formaterPrix(calculerTotal())}
                  </span>
                </div>
                {commande.frais_livraison > 0 && (
                  <div className="d-flex justify-between">
                    <span className="text-sm text-gray-600">Frais de livraison</span>
                    <span className="font-medium text-gray-900">
                      {formaterPrix(commande.frais_livraison)}
                    </span>
                  </div>
                )}
                <div className="d-flex justify-between pt-2 border-top border-gray-200">
                  <span className="font-semibold text-gray-900">Total à payer</span>
                  <span className="font-bold text-primary text-lg">
                    {formaterPrix(calculerTotal() + (commande.frais_livraison || 0))}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Produits commandés */}
        <div className="mb-6">
          <h2 className="font-bold text-gray-900 text-lg mb-4">
            Produits commandés ({commande.lignes?.length || 0})
          </h2>
          
          <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
            {commande.lignes?.map((ligne, index) => {
              const produit = ligne.produit_detail || {};
              return (
                <Card key={index} className="border border-gray-100 overflow-hidden">
                  <div className="d-flex gap-4 p-4">
                    <div className="w-20 h-20 flex-0">
                      <img
                        src={produit.media || produit.image || 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&auto=format&fit=crop&q=80'}
                        alt={produit.nom}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{produit.nom || 'Produit inconnu'}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {ligne.quantite} kg × {formaterPrix(ligne.prix_unitaire)}
                      </p>
                      <div className="d-flex gap-2">
                        <Badge variant="primary" size="sm">
                          {produit.categorie || 'Poisson'}
                        </Badge>
                        {produit.pecheur?.est_premium && (
                          <Badge variant="secondary" size="sm">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex-0 text-right">
                      <p className="font-bold text-primary text-lg">
                        {formaterPrix(ligne.sous_total || 0)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-4 text-right">
            <p className="text-sm text-gray-500">
              Total: {calculerQuantiteTotale()} kg pour {commande.lignes?.length || 0} produit(s)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg mb-4">
            Actions disponibles
          </h3>
          <div className="d-flex flex-wrap gap-4">
            {commande.statut === 'en_attente_paiement' && (
              <Button
                variant="primary"
                onClick={() => navigate(`/acheteur/paiement/${commande.id}`)}
                className="d-flex align-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Payer la commande</span>
              </Button>
            )}

            {['en_attente_pecheur', 'en_attente_paiement'].includes(commande.statut) && (
              <Button
                variant="danger-outline"
                onClick={handleAnnulerCommande}
                disabled={chargement}
                loading={chargement}
                className="d-flex align-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Annuler la commande</span>
              </Button>
            )}

            {commande.statut === 'en_livraison' && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/acheteur/suivi-livraison/${commande.id}`)}
                className="d-flex align-center gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>Suivre la livraison</span>
              </Button>
            )}

            {commande.statut === 'livree' && (
              <Button
                variant="outline"
                onClick={() => navigate(`/acheteur/note/${commande.id}`)}
                className="d-flex align-center gap-2"
              >
                <Star className="w-4 h-4" />
                <span>Noter le pêcheur</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => window.print()}
              className="d-flex align-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(`Commande #${commande.numero || commande.id}`);
                setSucces('Numéro de commande copié!');
              }}
              className="d-flex align-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Partager</span>
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg mb-4">
            Historique de la commande
          </h3>
          <div className="position-relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
            
            <div className="space-y-6">
              {[
                {
                  date: commande.date_commande,
                  titre: 'Commande passée',
                  description: `Vous avez passé cette commande pour un total de ${formaterPrix(calculerTotal() + (commande.frais_livraison || 0))}`
                },
                {
                  date: commande.date_limite_confirmation,
                  titre: 'En attente du pêcheur',
                  description: 'Le pêcheur doit confirmer votre commande'
                },
                ...(commande.statut === 'en_attente_paiement' || commande.statut === 'livree' || commande.statut === 'en_livraison' || commande.statut === 'en_recherche_livreur' ? [
                  {
                    date: null,
                    titre: 'Confirmation du pêcheur',
                    description: 'Le pêcheur a confirmé votre commande'
                  }
                ] : []),
                ...(commande.statut === 'en_attente_paiement' || commande.statut === 'livree' || commande.statut === 'en_livraison' || commande.statut === 'en_recherche_livreur' ? [
                  {
                    date: null,
                    titre: 'Paiement requis',
                    description: 'Votre paiement est en attente de validation'
                  }
                ] : []),
                ...(commande.statut === 'en_livraison' || commande.statut === 'livree' ? [
                  {
                    date: null,
                    titre: 'Livreur assigné',
                    description: 'Un livreur a été assigné à votre commande'
                  }
                ] : []),
                ...(commande.statut === 'livree' ? [
                  {
                    date: commande.date_livraison || new Date().toISOString(),
                    titre: 'Livraison terminée',
                    description: 'Votre commande a été livrée avec succès'
                  }
                ] : [])
              ].map((etape, index) => {
                const estDerniere = index === [
                  { date: commande.date_commande, titre: 'Commande passée' },
                  { date: commande.date_limite_confirmation, titre: 'En attente du pêcheur' },
                  ...(commande.statut !== 'en_attente_pecheur' && commande.statut !== 'en_attente_paiement' ? [
                    { date: null, titre: 'Confirmation du pêcheur' }
                  ] : []),
                  ...(commande.statut === 'en_attente_paiement' || commande.statut === 'livree' || commande.statut === 'en_livraison' ? [
                    { date: null, titre: 'Paiement requis' }
                  ] : []),
                  ...(commande.statut === 'en_livraison' || commande.statut === 'livree' ? [
                    { date: null, titre: 'Livreur assigné' }
                  ] : []),
                  ...(commande.statut === 'livree' ? [
                    { date: commande.date_livraison || new Date().toISOString(), titre: 'Livraison terminée' }
                  ] : [])
                ].length - 1;

                return (
                  <div key={index} className="position-relative">
                    <div className="w-16 h-16 bg-gray-100 rounded-full d-flex align-center justify-center border-2 border-white shadow-sm">
                      {React.cloneElement(getStatutIcon(commande.statut), {
                        className: 'w-6 h-6 text-gray-600'
                      })}
                    </div>
                    <div className="ml-24 pb-6">
                      <p className="text-sm text-gray-500 mb-1">
                        {etape.date ? formaterDate(etape.date) : 'À venir'}
                      </p>
                      <h4 className="font-semibold text-gray-900 mb-1">{etape.titre}</h4>
                      <p className="text-sm text-gray-600">{etape.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

