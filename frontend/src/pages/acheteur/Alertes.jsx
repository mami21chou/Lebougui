import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Trash2, AlertCircle, CheckCircle, XCircle, Clock, Fish, Star, MapPin, ArrowLeft } from 'lucide-react';
import { useCommandes } from '../../context/CommandeContext';
import { useAuth } from '../../context/AuthContext';
import { usePublications } from '../../context/PublicationContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Alertes() {
  const navigate = useNavigate();
  const { estAuthentifie, estPremium } = useAuth();
  const { alertes, chargerAlertes, creerAlerte, desactiverAlerte, supprimerAlerte } = useCommandes();
  const { publications } = usePublications();

  const [nouvelleAlerte, setNouvelleAlerte] = useState({ nomPoisson: '', zone: '' });
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState('active');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/connexion');
      return;
    }

    if (estAuthentifie()) {
      chargerAlertes();
    }
  }, [navigate, estAuthentifie, chargerAlertes]);

  // Récupérer les poissons disponibles pour l'autocomplétion
  const poissonsDisponibles = [...new Set(publications.produits.map(p => p.nom))].filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nouvelleAlerte.nomPoisson.trim()) {
      setErreur('Veuillez indiquer un nom de poisson');
      return;
    }

    setChargement(true);
    setErreur(null);

    try {
      const result = await creerAlerte(
        nouvelleAlerte.nomPoisson,
        null,
        null
      );

      if (result.success) {
        setNouvelleAlerte({ nomPoisson: '', zone: '' });
        setAfficherFormulaire(false);
        setSucces('Alerte créée avec succès! Vous serez notifié quand ce produit sera disponible.');
        setTimeout(() => setSucces(null), 5000);
      } else {
        setErreur(result.error || 'Erreur lors de la création de l\'alerte');
      }
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue');
    } finally {
      setChargement(false);
    }
  };

  const handleDelete = async (alerteId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette alerte?')) {
      try {
        await supprimerAlerte(alerteId);
        setSucces('Alerte supprimée avec succès');
        setTimeout(() => setSucces(null), 3000);
      } catch (err) {
        setErreur(err.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleToggleStatut = async (alerte) => {
    try {
      const newStatut = alerte.statut === 'active' ? 'inactive' : 'active';
      await desactiverAlerte(alerte.id);
      setSucces(`Alerte ${newStatut === 'active' ? 'activée' : 'désactivée'} avec succès`);
      setTimeout(() => setSucces(null), 3000);
    } catch (err) {
      setErreur(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const filteredAlertes = alertes.liste.filter(alerte => {
    if (filtreStatut === 'toutes') return true;
    return alerte.statut?.toLowerCase() === filtreStatut?.toLowerCase();
  });

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      default: return statut;
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'active': return 'success';
      case 'inactive': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="d-flex align-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Alertes Premium
            </h1>
            <p className="text-gray-600">
              {estPremium() 
                ? 'Créez des alertes pour être notifié quand vos produits préférés sont disponibles' 
                : 'Souscrivez à l\'offre Premium pour créer des alertes personnalisées'
              }
            </p>
          </div>
          {!estPremium() ? (
            <Button
              variant="primary"
              onClick={() => navigate('/acheteur/premium')}
              className="d-flex align-center gap-2"
            >
              <Star className="w-4 h-4" />
              <span>Devenir Premium</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setAfficherFormulaire(!afficherFormulaire)}
              className="d-flex align-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle alerte</span>
            </Button>
          )}
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

        {/* Formulaire de création d'alerte */}
        {afficherFormulaire && estPremium() && (
          <Card className="mb-6 border border-gray-100">
            <Card.Body className="p-4">
              <h2 className="font-bold text-gray-900 text-lg mb-4">
                Créer une nouvelle alerte
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <Input
                    label="Nom du poisson"
                    placeholder="Ex: Thiof, Capitaine, Crevettes..."
                    value={nouvelleAlerte.nomPoisson}
                    onChange={(e) => setNouvelleAlerte({ ...nouvelleAlerte, nomPoisson: e.target.value })}
                    required
                    error={erreur?.includes('poisson') ? erreur : null}
                  />
                  <div className="mt-2">
                    <datalist id="poissons">
                      {poissonsDisponibles.map((poisson, index) => (
                        <option key={index} value={poisson} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="mb-4">
                  <Input
                    label="Zone (facultatif)"
                    placeholder="Ex: Soumbédioune, Dakar..."
                    value={nouvelleAlerte.zone}
                    onChange={(e) => setNouvelleAlerte({ ...nouvelleAlerte, zone: e.target.value })}
                  />
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    loading={chargement}
                    disabled={chargement}
                  >
                    Créer l'alerte
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setAfficherFormulaire(false);
                      setNouvelleAlerte({ nomPoisson: '', zone: '' });
                      setErreur(null);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        )}

        {/* Non premium - Message d'incitation */}
        {!estPremium() && !estPremium() && (
          <Card className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <Card.Body className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full d-flex align-center justify-center mx-auto mb-4">
                <Star className="text-amber-500 w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-2">
                Passez Premium!
              </h3>
              <p className="text-gray-600 text-sm mb-4 max-w-400 mx-auto">
                Avec l'abonnement Premium, recevez des notifications instantanées par WhatsApp 
                dès qu'un pêcheur publie le produit que vous recherchez. Ne manquez plus jamais 
                les meilleures prises!
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/acheteur/premium')}
                className="d-flex align-center gap-2 mx-auto"
              >
                <Star className="w-4 h-4" />
                <span>Souscrire à Premium</span>
              </Button>
            </Card.Body>
          </Card>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="d-flex gap-2">
            <Button
              variant={filtreStatut === 'active' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFiltreStatut('active')}
              className="d-flex align-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Active ({alertes.liste.filter(a => a.statut === 'active').length})</span>
            </Button>
            <Button
              variant={filtreStatut === 'inactive' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFiltreStatut('inactive')}
              className="d-flex align-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Inactive ({alertes.liste.filter(a => a.statut === 'inactive').length})</span>
            </Button>
            <Button
              variant={filtreStatut === 'toutes' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFiltreStatut('toutes')}
              className="d-flex align-center gap-2"
            >
              <span>Toutes ({alertes.liste.length})</span>
            </Button>
          </div>
        </div>

        {/* Liste des alertes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {alertes.chargement ? (
            <div className="d-flex justify-center align-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredAlertes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full d-flex align-center justify-center mx-auto mb-4">
                <Bell className="text-gray-400 w-10 h-10" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Aucune alerte
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {estPremium() 
                  ? 'Créez votre première alerte pour être notifié des nouvelles publications' 
                  : 'Souscrivez à Premium pour créer vos premières alertes'
                }
              </p>
              {estPremium() && (
                <Button
                  variant="primary"
                  onClick={() => setAfficherFormulaire(true)}
                  className="d-flex align-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer une alerte</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAlertes.map((alerte, index) => (
                <div key={alerte.id || index} className="p-4 hover:bg-gray-50 transition">
                  <div className="d-flex flex-column md-flex-row gap-4">
                    {/* Icône */}
                    <div className="flex-0">
                      <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-xl d-flex align-center justify-center">
                        <Fish className="text-primary w-6 h-6" />
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="flex-1">
                      <div className="d-flex align-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{alerte.nom_poisson}</h3>
                        <Badge variant={getStatutColor(alerte.statut)} size="sm">
                          {getStatutLabel(alerte.statut)}
                        </Badge>
                      </div>
                      
                      {alerte.zone && (
                        <p className="text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 inline" /> {alerte.zone}
                        </p>
                      )}

                      <div className="d-flex align-center gap-4 text-sm text-gray-500">
                        <div className="d-flex align-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            Créée le {new Date(alerte.date_creation || alerte.created_at || new Date()).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-0 d-flex align-center gap-2">
                      {alerte.statut === 'active' ? (
                        <Button
                          variant="warning-outline"
                          size="sm"
                          onClick={() => handleToggleStatut(alerte)}
                          className="d-flex align-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span className="d-none md-d-inline">Désactiver</span>
                        </Button>
                      ) : (
                        <Button
                          variant="success-outline"
                          size="sm"
                          onClick={() => handleToggleStatut(alerte)}
                          className="d-flex align-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span className="d-none md-d-inline">Activer</span>
                        </Button>
                      )}
                      
                      <Button
                        variant="danger-outline"
                        size="sm"
                        onClick={() => handleDelete(alerte.id)}
                        className="d-flex align-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="d-none md-d-inline">Supprimer</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produits disponibles correspondant aux alertes */}
        {estPremium() && filteredAlertes.length > 0 && (
          <div className="mt-6">
            <h2 className="font-bold text-gray-900 text-xl mb-4">
              Produits disponibles correspondant à vos alertes
            </h2>
            <div className="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 gap-4">
              {publications.produits
                .filter(produit => {
                  const alertePoissons = filteredAlertes.map(a => a.nom_poisson.toLowerCase());
                  return alertePoissons.includes((produit.nom || '').toLowerCase());
                })
                .slice(0, 4)
                .map(produit => (
                  <Card
                    key={produit.id}
                    className="overflow-hidden shadow-sm hover-shadow-md transition"
                    hoverable
                    onClick={() => navigate(`/acheteur/produit/${produit.id}`)}
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={produit.media || produit.image || 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&auto=format&fit=crop&q=80'}
                        alt={produit.nom}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                      <span className="position-absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-semibold text-primary">
                        {produit.categorie || 'POISSON'}
                      </span>
                      <span className="position-absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full d-flex align-center justify-center">
                        <Bell className="text-white w-3 h-3" />
                      </span>
                    </div>
                    <Card.Body className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm line-height-sm mb-1">
                        {produit.nom}
                      </h3>
                      <p className="text-primary font-bold text-sm mb-2">
                        {new Intl.NumberFormat('fr-FR').format(produit.prix || 0)} FCFA
                      </p>
                      <p className="text-xs text-gray-500">
                        {produit.quantite} kg disponibles - {produit.adresse || 'Dakar'}
                      </p>
                    </Card.Body>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
