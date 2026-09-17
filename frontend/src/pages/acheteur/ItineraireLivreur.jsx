import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Navigation, Clock, Truck, Package, CheckCircle, User, Phone, ArrowLeft, RefreshCw, Compass, Locate } from 'lucide-react';
import { useCommandes } from '../../context/CommandeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ItineraireLivreur() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { mesCommandes, chargerMesCommandes } = useCommandes();
  const { estAuthentifie } = useAuth();

  const mapRef = useRef(null);
  const [commande, setCommande] = useState(null);
  const [livraison, setLivraison] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [positionActuelle, setPositionActuelle] = useState(null);
  const [center, setCenter] = useState({ lat: 14.6928, lng: -17.4467 }); // Dakar par défaut
  const [zoom, setZoom] = useState(12);

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
      // Chercher la commande avec la livraison
      const foundCommande = mesCommandes.liste.find(cmd => {
        return cmd.id == id || cmd.livraison?.id == id;
      });
      
      if (foundCommande) {
        setCommande(foundCommande);
        setLivraison(foundCommande.livraison || foundCommande.livraisons?.[0]);
        
        // Définir le centre de la carte
        if (foundCommande.latitude_livraison && foundCommande.longitude_livraison) {
          setCenter({
            lat: parseFloat(foundCommande.latitude_livraison),
            lng: parseFloat(foundCommande.longitude_livraison)
          });
        }
        
        // Définir la position du pêcheur
        if (foundCommande.lignes?.[0]?.produit?.latitude && foundCommande.lignes?.[0]?.produit?.longitude) {
          setPositionActuelle({
            lat: parseFloat(foundCommande.lignes[0].produit.latitude),
            lng: parseFloat(foundCommande.lignes[0].produit.longitude)
          });
        }
      }
      setChargement(false);
    }
  }, [id, mesCommandes.liste]);

  // Simulation de mise à jour de la position (dans une vraie app, cela viendrait d'une API WebSocket)
  useEffect(() => {
    if (!chargement && livraison) {
      // Mettre à jour la position toutes les 5 secondes pour la démo
      const interval = setInterval(() => {
        // Simulation: déplacer légèrement la position
        if (positionActuelle) {
          const newLat = positionActuelle.lat + (Math.random() * 0.001 - 0.0005);
          const newLng = positionActuelle.lng + (Math.random() * 0.001 - 0.0005);
          setPositionActuelle({ lat: newLat, lng: newLng });
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [positionActuelle, livraison, chargement]);

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

  const calculerDistance = (lat1, lon1, lat2, lon2) => {
    // Formule de Haversine pour calculer la distance
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  const getStatutCouleur = (statut) => {
    switch (statut) {
      case 'en_attente': return 'gray';
      case 'acceptee': return 'primary';
      case 'en_cours': return 'secondary';
      case 'livree': return 'success';
      default: return 'gray';
    }
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'acceptee': return 'Acceptée';
      case 'en_cours': return 'En cours';
      case 'livree': return 'Livrée';
      default: return statut;
    }
  };

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

  if (!commande && !livraison) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] p-4 md:p-6">
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full d-flex align-center justify-center mx-auto mb-4">
            <Compass className="text-gray-400 w-10 h-10" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">
            Itinéraire non trouvé
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Impossible de trouver l'itinéraire de livraison pour cette commande
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
            Itinéraire en direct du livreur
          </h1>
          <p className="text-gray-600">
            Suivez en temps réel le parcours de votre livraison
          </p>
        </div>

        {/* Informations de la livraison */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg mb-4">
            Détails de la livraison
          </h2>
          
          <div className="grid grid-cols-1 md-grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Livreur</p>
              <p className="font-medium text-gray-900">
                {livraison?.nom_livreur || commande?.livreur?.nom || 'Non assigné'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Statut</p>
              <Badge variant={getStatutCouleur(livraison?.statut)} size="sm">
                {getStatutLabel(livraison?.statut)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Distance estimée</p>
              <p className="font-medium text-gray-900">
                {commande.distance_km ? commande.distance_km + ' km' : 
                 (positionActuelle && center.lat && center.lng 
                   ? calculerDistance(positionActuelle.lat, positionActuelle.lng, center.lat, center.lng) + ' km'
                   : 'Calcul en cours...')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">
                <MapPin className="w-4 h-4 inline" /> Point de récupération
              </p>
              <p className="font-medium text-gray-900">
                {commande.lignes?.[0]?.produit?.adresse || commande.adresse || 'Non spécifié'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">
                <Package className="w-4 h-4 inline" /> Adresse de livraison
              </p>
              <p className="font-medium text-gray-900">
                {commande.adresse_livraison || 'Non spécifiée'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-top border-gray-100">
            <p className="text-sm text-gray-500 mb-1">
              <Clock className="w-4 h-4 inline" /> Heure estimée d'arrivée
            </p>
            <p className="font-medium text-gray-900">
              {livraison?.date_livraison 
                ? formaterDate(livraison.date_livraison) 
                : commande.date_livraison 
                  ? formaterDate(commande.date_livraison)
                  : 'Calcul en cours...'}
            </p>
          </div>
        </div>

        {/* Carte - Simulation (dans une vraie app, on utiliserait Google Maps ou Leaflet) */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg mb-4">
            Carte de suivi en temps réel
          </h2>
          
          {/* Carte simplifiée */}
          <div
            ref={mapRef}
            className="relative h-96 md-h-128 bg-gray-100 rounded-xl overflow-hidden border border-gray-200"
          >
            {/* Fond de carte - simulation */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'url(https://maps.googleapis.com/maps/api/staticmap?center=' +
                  center.lat + ',' + center.lng + '&zoom=' + zoom + '&size=800x600&maptype=roadmap&key=YOUR_API_KEY)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            {/* Grille de fond si l'image de la carte n'est pas disponible */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50" />
            
            {/* Marqueur - Point de récupération (pêcheur) */}
            {positionActuelle && (
              <div
                className="absolute"
                style={{
                  left: `${((positionActuelle.lng + 180) / 360) * 100}%`,
                  top: `${((90 - positionActuelle.lat) / 180) * 100}%`
                }}
              >
                <div className="relative d-flex flex-column align-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full d-flex align-center justify-center border-2 border-white shadow-lg">
                    <MapPin className="text-white w-5 h-5" />
                  </div>
                  <div className="bg-white px-2 py-1 rounded shadow-md mt-1 text-xs whitespace-nowrap">
                    Récupération
                  </div>
                </div>
              </div>
            )}

            {/* Marqueur - Position actuelle du livreur */}
            {positionActuelle && (
              <div
                className="absolute"
                style={{
                  left: `${((positionActuelle.lng + 0.005 + 180) / 360) * 100}%`,
                  top: `${((90 - (positionActuelle.lat + 0.005)) / 180) * 100}%`
                }}
              >
                <div className="relative d-flex flex-column align-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full d-flex align-center justify-center border-2 border-white shadow-lg animate-pulse">
                    <Truck className="text-white w-5 h-5" />
                  </div>
                  <div className="bg-white px-2 py-1 rounded shadow-md mt-1 text-xs whitespace-nowrap">
                    Livreur
                  </div>
                </div>
              </div>
            )}

            {/* Marqueur - Destination */}
            {center.lat && center.lng && (
              <div
                className="absolute"
                style={{
                  left: `${((center.lng + 180) / 360) * 100}%`,
                  top: `${((90 - center.lat) / 180) * 100}%`
                }}
              >
                <div className="relative d-flex flex-column align-center">
                  <div className="w-8 h-8 bg-red-500 rounded-full d-flex align-center justify-center border-2 border-white shadow-lg">
                    <Package className="text-white w-5 h-5" />
                  </div>
                  <div className="bg-white px-2 py-1 rounded shadow-md mt-1 text-xs whitespace-nowrap">
                    Livraison
                  </div>
                </div>
              </div>
            )}

            {/* Informations de la carte */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-md">
              <p className="text-sm font-medium text-gray-800">
                Lat: {positionActuelle ? positionActuelle.lat.toFixed(4) : 'N/A'}°
              </p>
              <p className="text-sm font-medium text-gray-800">
                Lng: {positionActuelle ? positionActuelle.lng.toFixed(4) : 'N/A'}°
              </p>
            </div>

            {/* Contrôles de la carte */}
            <div className="absolute bottom-4 right-4 d-flex flex-column gap-2">
              <button
                onClick={() => setZoom(zoom + 1)}
                className="w-10 h-10 bg-white rounded-lg shadow-md d-flex align-center justify-center hover:bg-gray-50 transition"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setZoom(Math.max(8, zoom - 1))}
                className="w-10 h-10 bg-white rounded-lg shadow-md d-flex align-center justify-center hover:bg-gray-50 transition"
              >
                <Minus className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => {
                  if (positionActuelle) {
                    setCenter(positionActuelle);
                    setZoom(15);
                  }
                }}
                className="w-10 h-10 bg-white rounded-lg shadow-md d-flex align-center justify-center hover:bg-gray-50 transition"
              >
                <Locate className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Légende */}
          <div className="mt-4 d-flex gap-6 flex-wrap">
            <div className="d-flex align-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">Point de récupération</span>
            </div>
            <div className="d-flex align-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">Livreur en mouvement</span>
            </div>
            <div className="d-flex align-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full" />
              <span className="text-sm text-gray-600">Destination</span>
            </div>
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="grid grid-cols-1 lg-grid-cols-2 gap-6 mb-6">
          {/* Produits commandés */}
          <Card className="border border-gray-100">
            <Card.Body className="p-4">
              <h3 className="font-bold text-gray-900 mb-4">
                Produits commandés
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
              <div className="mt-4 pt-3 border-top border-gray-100 d-flex justify-between">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-primary">{formaterPrix(calculerTotal())}</span>
              </div>
              {commande.frais_livraison > 0 && (
                <div className="mt-2 d-flex justify-between text-sm">
                  <span className="text-gray-600">Frais de livraison:</span>
                  <span className="text-gray-900">{formaterPrix(commande.frais_livraison)}</span>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Informations du livreur */}
          <Card className="border border-gray-100">
            <Card.Body className="p-4">
              <h3 className="font-bold text-gray-900 mb-4">
                Informations du livreur
              </h3>
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full d-flex align-center justify-center mx-auto mb-4 overflow-hidden">
                  {livraison?.livreur?.utilisateur?.photo ? (
                    <img
                      src={livraison.livreur.utilisateur.photo}
                      alt="Livreur"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Truck className="text-gray-500 w-12 h-12" />
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {livraison?.nom_livreur || commande?.livreur?.nom || 'Livreur non assigné'}
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Livreur professionnel
                </p>
                
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="d-flex align-center gap-2">
                    <Phone className="text-gray-400 w-4 h-4" />
                    <span className="text-sm text-gray-700">
                      {livraison?.telephone || 'Non disponible'}
                    </span>
                  </div>
                  <div className="d-flex align-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded-full d-flex align-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {(livraison?.nom_livreur?.[0] || 'L').toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">ID: #{livraison?.id || 'N/A'}</span>
                  </div>
                  <div className="d-flex align-center gap-2 col-span-2">
                    <div className="w-4 h-4 bg-amber-100 rounded-full d-flex align-center justify-center">
                      <Star className="text-amber-500 w-3 h-3" />
                    </div>
                    <span className="text-sm text-gray-700">
                      Note: {livraison?.note || 'Non noté'}/5
                    </span>
                  </div>
                </div>

                {livraison?.vehicule && (
                  <div className="mt-4 pt-3 border-top border-gray-100">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Véhicule
                    </h5>
                    <div className="d-flex align-center gap-3">
                      <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg d-flex align-center justify-center">
                        <Compass className="text-primary w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {livraison.vehicule.type_vehicule}
                        </p>
                        <p className="text-xs text-gray-500">
                          {livraison.vehicule.immatriculation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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

            <Button
              variant="outline-secondary"
              onClick={() => navigate(`/acheteur/suivi-livraison/${commande.id}`)}
              className="d-flex align-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Voir l'historique</span>
            </Button>

            {livraison?.telephone && (
              <Button
                variant="success"
                onClick={() => {
                  if (livraison.telephone) {
                    window.location.href = `tel:${livraison.telephone}`;
                  }
                }}
                className="d-flex align-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Appeler le livreur</span>
              </Button>
            )}
          </div>
        </div>

        {/* Note */}
        <Card className="bg-amber-50 border border-amber-200">
          <Card.Body className="p-4 text-center">
            <p className="text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 inline mx-2" />
              Cette carte est une simulation. Dans l'application réelle, une carte interactive 
              (Google Maps ou Mapbox) sera intégrée pour un suivi en temps réel précis.
            </p>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

// Icônes pour les boutons de zoom
const Plus = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
</svg>;

const Minus = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
</svg>;
