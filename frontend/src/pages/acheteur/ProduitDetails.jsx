import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, MapPin, Clock, User, Phone, Star, Fish, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { usePublications } from '../../context/PublicationContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProduitDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { publications, chargerPublications } = usePublications();
  const { estAuthentifie } = useAuth();

  const [produit, setProduit] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [quantite, setQuantite] = useState(1);
  const [dansPanier, setDansPanier] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/connexion');
      return;
    }

    if (estAuthentifie()) {
      chargerPublications();
    }
  }, [navigate, estAuthentifie, chargerPublications]);

  useEffect(() => {
    if (publications.produits.length > 0) {
      const foundProduit = publications.produits.find(p => p.id == id);
      if (foundProduit) {
        setProduit(foundProduit);
      }
      setChargement(false);
    }
  }, [id, publications.produits]);

  // Vérifier si le produit est dans le panier
  useEffect(() => {
    const panier = JSON.parse(localStorage.getItem('panier_acheteur') || '[]');
    const existe = panier.some(item => item.id == id);
    setDansPanier(existe);
  }, [id]);

  // Mettre à jour la quantité
  const mettreAJourQuantite = (delta) => {
    setQuantite(prev => {
      const newQuantite = prev + delta;
      return Math.max(1, Math.min(newQuantite, produit?.quantite || 100));
    });
  };

  // Ajouter au panier
  const ajouterAuPanier = () => {
    const panier = JSON.parse(localStorage.getItem('panier_acheteur') || '[]');
    const existe = panier.find(item => item.id == produit?.id);
    
    if (existe) {
      // Mettre à jour la quantité
      const newPanier = panier.map(item => 
        item.id == produit?.id 
          ? { ...item, quantite: (item.quantite || 0) + quantite }
          : item
      );
      localStorage.setItem('panier_acheteur', JSON.stringify(newPanier));
    } else {
      // Ajouter nouveau
      const newItem = {
        ...produit,
        quantite
      };
      panier.push(newItem);
      localStorage.setItem('panier_acheteur', JSON.stringify(panier));
    }
    
    setDansPanier(true);
    
    // Afficher une notification
    navigate('/acheteur/panier', { 
      state: { 
        produit: { ...produit, quantite },
        message: 'Produit ajouté au panier avec succès!' 
      } 
    });
  };

  // Formater le prix
  const formaterPrix = (prix) => {
    return new Intl.NumberFormat('fr-FR').format(prix || 0) + ' FCFA';
  };

  // Calculer le sous-total
  const calculerSousTotal = () => {
    return (produit?.prix || 0) * quantite;
  };

  // Vérifier la disponibilité
  const estDisponible = () => {
    return produit?.statut === 'disponible' && (produit?.quantite || 0) > 0;
  };

  const getCategorieLabel = (categorie) => {
    if (categorie === 'poisson') return 'Poisson';
    if (categorie === 'fruit_de_mer') return 'Fruit de mer';
    return categorie;
  };

  if (chargement) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] d-flex align-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] p-4 md:p-6">
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full d-flex align-center justify-center mx-auto mb-4">
            <AlertCircle className="text-gray-400 w-10 h-10" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Produit non trouvé</h3>
          <p className="text-gray-600 text-sm mb-4">
            Le produit que vous cherchez n'existe pas ou n'est plus disponible
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/acheteur/accueil')}
          >
            Retour au marché
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

        {/* Contenu principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="d-flex flex-column lg-flex-row">
            {/* Image principale */}
            <div className="flex-0 lg-w-1/2 p-6 lg-p-8">
              <div className="relative aspect-square max-h-96 mx-auto">
                <img
                  src={produit.media || produit.image || 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=800&auto=format&fit=crop&q=80'}
                  alt={produit.nom}
                  className="w-full h-full object-contain rounded-lg"
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 d-flex flex-column gap-2">
                  <span className="px-3 py-1 bg-white bg-opacity-90 backdrop-blur-sm rounded-full text-sm font-semibold text-primary shadow-sm">
                    {getCategorieLabel(produit.categorie)}
                  </span>
                  {produit.pecheur?.est_premium && (
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-sm font-semibold text-white shadow-sm">
                      Pêcheur Premium
                    </span>
                  )}
                </div>

                <div className="absolute top-4 right-4 d-flex flex-column gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white shadow-sm ${
                    estDisponible() 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}>
                    {estDisponible() ? 'Disponible' : 'Rupture de stock'}
                  </span>
                  <span className="px-3 py-1 bg-white bg-opacity-90 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                    {produit.quantite || 0} kg en stock
                  </span>
                </div>
              </div>
            </div>

            {/* Détails du produit */}
            <div className="flex-1 p-6 lg-p-8 border-top lg-border-top-none lg-border-left border-gray-100">
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {produit.nom}
                </h1>
                <div className="d-flex align-center gap-2">
                  <div className="d-flex text-amber-400">
                    <Star className="w-5 h-5" />
                    <Star className="w-5 h-5" />
                    <Star className="w-5 h-5" />
                    <Star className="w-5 h-5" />
                    <Star className="w-5 h-5" />
                  </div>
                  <span className="text-gray-500 text-sm">(0 avis)</span>
                </div>
              </div>

              {/* Prix et quantité */}
              <div className="mb-6">
                <div className="d-flex align-center gap-4 mb-4">
                  <div>
                    <span className="text-3xl md:text-4xl font-bold text-primary">
                      {formaterPrix(produit.prix)}
                    </span>
                    <span className="text-gray-500 ml-2">/kg</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  {produit.description || `Poisson frais pêché le ${new Date(produit.date_publication).toLocaleDateString('fr-FR')}`}
                </p>

                {/* Sélection de la quantité */}
                <div className="d-flex align-center gap-4 mb-6">
                  <span className="font-medium text-gray-700">Quantité:</span>
                  <div className="d-flex align-center gap-2">
                    <button
                      onClick={() => mettreAJourQuantite(-1)}
                      disabled={quantite <= 1}
                      className="w-10 h-10 d-flex align-center justify-center bg-gray-100 rounded-lg border-none cursor-pointer hover:bg-gray-200 transition disabled-opacity-50 disabled-cursor-not-allowed"
                    >
                      <Minus className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="font-semibold text-lg min-w-30 text-center">
                      {quantite} kg
                    </span>
                    <button
                      onClick={() => mettreAJourQuantite(1)}
                      disabled={quantite >= (produit.quantite || 100)}
                      className="w-10 h-10 d-flex align-center justify-center bg-primary bg-opacity-10 rounded-lg border-none cursor-pointer hover:bg-primary hover:bg-opacity-20 transition disabled-opacity-50 disabled-cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5 text-primary" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    Max: {produit.quantite || 0} kg
                  </span>
                </div>

                {/* Sous-total */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="d-flex justify-between">
                    <span className="font-medium text-gray-700">Sous-total:</span>
                    <span className="font-bold text-primary text-xl">
                      {formaterPrix(calculerSousTotal())}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-4">
                  <Button
                    variant="primary"
                    onClick={ajouterAuPanier}
                    disabled={!estDisponible()}
                    className="flex-1 d-flex align-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{dansPanier ? 'Mettre à jour le panier' : 'Ajouter au panier'}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      const panier = [{ ...produit, quantite }];
                      localStorage.setItem('panier_acheteur', JSON.stringify(panier));
                      navigate('/acheteur/panier');
                    }}
                    className="flex-0"
                  >
                    Acheter maintenant
                  </Button>
                </div>
              </div>
          </div>
        </div>

        {/* Informations du pêcheur */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="font-bold text-gray-900 text-xl mb-6">
              Informations du pêcheur
            </h2>

            <div className="d-flex flex-column md-flex-row gap-6">
              {/* Photo du pêcheur */}
              <div className="d-flex flex-column align-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full d-flex align-center justify-center overflow-hidden mb-4">
                  {produit.pecheur?.photo ? (
                    <img
                      src={produit.pecheur.photo}
                      alt={produit.pecheur.prenom}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-gray-500 w-12 h-12" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">
                  {produit.pecheur?.prenom} {produit.pecheur?.nom}
                </h3>
                <p className="text-sm text-gray-500">Pêcheur professionnel</p>
              </div>

              {/* Détails */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
                  <div className="d-flex align-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg d-flex align-center justify-center">
                      <Phone className="text-blue-500 w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium text-gray-900">{produit.pecheur?.telephone || 'Non disponible'}</p>
                    </div>
                  </div>

                  <div className="d-flex align-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg d-flex align-center justify-center">
                      <MapPin className="text-green-500 w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Zone de pêche</p>
                      <p className="font-medium text-gray-900">{produit.adresse || 'Dakar'}</p>
                    </div>
                  </div>

                  <div className="d-flex align-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg d-flex align-center justify-center">
                      <Fish className="text-purple-500 w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Spécialité</p>
                      <p className="font-medium text-gray-900">{getCategorieLabel(produit.categorie)}</p>
                    </div>
                  </div>

                  <div className="d-flex align-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg d-flex align-center justify-center">
                      <Clock className="text-amber-500 w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Publication</p>
                      <p className="font-medium text-gray-900">
                        {new Date(produit.date_publication).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-top border-gray-100">
                  <button
                    onClick={() => navigate(`/pecheur/${produit.pecheur?.id}`)}
                    className="d-flex align-center gap-2 bg-transparent border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition"
                  >
                    <User className="w-4 h-4" />
                    <span>Voir le profil du pêcheur</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Autres produits du même pêcheur */}
        {produit.pecheur && (
          <div className="mt-6">
            <h2 className="font-bold text-gray-900 text-xl mb-4">
              Autres produits de {produit.pecheur.prenom}
            </h2>
            <div className="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3 xl-grid-cols-4 gap-4">
              {publications.produits
                .filter(p => p.pecheur?.id === produit.pecheur?.id && p.id != produit.id)
                .slice(0, 4)
                .map(otherProduit => (
                  <Card
                    key={otherProduit.id}
                    className="overflow-hidden shadow-sm hover-shadow-md transition"
                    hoverable
                    onClick={() => navigate(`/acheteur/produit/${otherProduit.id}`)}
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={otherProduit.media || otherProduit.image || 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&auto=format&fit=crop&q=80'}
                        alt={otherProduit.nom}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                      <span className="position-absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-semibold text-primary">
                        {getCategorieLabel(otherProduit.categorie)}
                      </span>
                    </div>
                    <Card.Body className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm line-height-sm mb-1">
                        {otherProduit.nom}
                      </h3>
                      <p className="text-primary font-bold text-sm mb-2">
                        {formaterPrix(otherProduit.prix)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {otherProduit.quantite} kg disponibles
                      </p>
                    </Card.Body>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
