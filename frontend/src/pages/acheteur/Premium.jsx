import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Star, Bell, Clock, Package, CheckCircle, XCircle, ArrowLeft, Sparkles, Gift, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Premium() {
  const navigate = useNavigate();
  const { estAuthentifie, estPremium, utilisateur, souscrirePremium } = useAuth();

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);
  const [abonnements] = useState([
    {
      id: 'mensuel',
      nom: 'Mensuel',
      prix: 2000,
      duree: '1 mois',
      popularite: false,
      fonctionnalites: [
        'Notifications instantanées par WhatsApp',
        'Alertes personnalisées illimitées',
        'Priorité dans les recherches',
        'Accès aux produits Premium',
        'Support client prioritaire'
      ]
    },
    {
      id: 'trimestriel',
      nom: 'Trimestriel',
      prix: 5000,
      duree: '3 mois',
      popularite: true,
      economie: 'Économisez 1000 FCFA',
      fonctionnalites: [
        'Notifications instantanées par WhatsApp',
        'Alertes personnalisées illimitées',
        'Priorité dans les recherches',
        'Accès aux produits Premium',
        'Support client prioritaire',
        'Statistiques avancées'
      ]
    },
    {
      id: 'annuel',
      nom: 'Annuel',
      prix: 18000,
      duree: '12 mois',
      popularite: false,
      economie: 'Économisez 6000 FCFA',
      fonctionnalites: [
        'Notifications instantanées par WhatsApp',
        'Alertes personnalisées illimitées',
        'Priorité dans les recherches',
        'Accès aux produits Premium',
        'Support client prioritaire',
        'Statistiques avancées',
        'Badge Premium visible',
        'Accès anticipé aux nouveaux produits'
      ]
    }
  ]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/connexion');
    }
  }, [navigate]);

  const formaterPrix = (prix) => {
    return new Intl.NumberFormat('fr-FR').format(prix) + ' FCFA';
  };

  const handleSouscrire = async (typeAbonnement) => {
    setChargement(true);
    setErreur(null);

    try {
      const result = await souscrirePremium('abonnement_acheteur', typeAbonnement);
      
      if (result.success) {
        setSucces(`Félicitations! Vous êtes maintenant abonné ${typeAbonnement}.`);
        setTimeout(() => {
          navigate('/acheteur/accueil');
        }, 3000);
      } else {
        setErreur(result.error || 'Erreur lors de la souscription');
      }
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue lors de la souscription');
    } finally {
      setChargement(false);
    }
  };

  const avantages = [
    {
      icon: <Bell className="w-6 h-6" />,
      titre: 'Notifications instantanées',
      description: 'Recevez des alertes WhatsApp dès qu\'un pêcheur publie le produit que vous recherchez'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      titre: 'Priorité absolue',
      description: 'Vos commandes sont traitées en priorité par les pêcheurs'
    },
    {
      icon: <Package className="w-6 h-6" />,
      titre: 'Accès exclusif',
      description: 'Découvrez des produits Premium réservés aux abonnés'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      titre: 'Statistiques avancées',
      description: 'Analysez vos achats avec des rapports détaillés'
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      titre: 'Badge Premium',
      description: 'Votre statut Premium est visible par tous les pêcheurs'
    },
    {
      icon: <Gift className="w-6 h-6" />,
      titre: 'Offres spéciales',
      description: 'Bénéficiez de réductions exclusives sur certains produits'
    }
  ];

  if (estPremium()) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] p-4 md:p-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full d-flex align-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-500 w-10 h-10" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Vous êtes déjà Premium!
          </h1>
          <p className="text-gray-600 mb-6">
            Votre abonnement est actif jusqu'au {utilisateur?.status_premium?.[0]?.date_expiration 
              ? new Date(utilisateur.status_premium[0].date_expiration).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : 'date inconnue'}
          </p>
          
          <div className="d-flex gap-4 justify-center flex-wrap">
            <Button
              variant="primary"
              onClick={() => navigate('/acheteur/alertes')}
              className="d-flex align-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Gérer mes alertes</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/acheteur/accueil')}
              className="d-flex align-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour au marché</span>
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 md-grid-cols-3 gap-6">
            {avantages.map((avantage, index) => (
              <Card key={index} className="border border-green-200 bg-green-50">
                <Card.Body className="p-4 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl d-flex align-center justify-center mx-auto mb-3">
                    {avantage.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{avantage.titre}</h3>
                  <p className="text-sm text-gray-600">{avantage.description}</p>
                </Card.Body>
              </Card>
            ))}
          </div>
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

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full d-flex align-center justify-center mx-auto mb-4">
            <Crown className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Passez au niveau supérieur
          </h1>
          <p className="text-gray-600 max-w-600 mx-auto">
            Devenez membre Premium et accédez à des fonctionnalités exclusives 
            pour optimiser vos achats de produits de la pêche
          </p>
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

        {/* Nos abonnements */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Nos formules d'abonnement
        </h2>

        <div className="grid grid-cols-1 md-grid-cols-3 gap-6 mb-8">
          {abonnements.map((abonnement, index) => (
            <Card
              key={abonnement.id}
              className={`border-2 transition hover-shadow-md ${
                abonnement.popularite 
                  ? 'border-primary bg-primary bg-opacity-5' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Card.Body className="p-4">
                {/* Badge populaire */}
                {abonnement.popularite && (
                  <div className="mb-3">
                    <Badge variant="primary" size="sm" className="w-full">
                      Le plus populaire
                    </Badge>
                  </div>
                )}

                {/* Nom et prix */}
                <div className="text-center mb-4">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">
                    {abonnement.nom}
                  </h3>
                  <div className="d-flex align-center justify-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-primary">
                      {formaterPrix(abonnement.prix)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    / {abonnement.duree}
                  </p>
                  {abonnement.economie && (
                    <p className="text-xs text-green-600 mt-1">{abonnement.economie}</p>
                  )}
                </div>

                {/* Fonctionnalités */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Ce qui est inclus:
                  </h4>
                  <ul className="space-y-2">
                    {abonnement.fonctionnalites.map((f, i) => (
                      <li key={i} className="d-flex align-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bouton de souscription */}
                <Button
                  variant={abonnement.popularite ? 'primary' : 'outline-primary'}
                  onClick={() => handleSouscrire(abonnement.id)}
                  disabled={chargement}
                  loading={chargement}
                  className="w-full py-3"
                >
                  Choisir cette formule
                </Button>
              </Card.Body>
            </Card>
          ))}
        </div>

        {/* Avantages Premium */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Pourquoi choisir Premium?
          </h2>
          <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6">
            {avantages.map((avantage, index) => (
              <div key={index} className="text-center p-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl d-flex align-center justify-center mx-auto mb-3">
                  {React.cloneElement(avantage.icon, {
                    className: 'text-blue-500 w-6 h-6'
                  })}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{avantage.titre}</h3>
                <p className="text-sm text-gray-600">{avantage.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Témoignages */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Ce que disent nos membres Premium
          </h2>
          <div className="grid grid-cols-1 md-grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="border-none bg-white bg-opacity-50">
                <Card.Body className="p-4">
                  <div className="d-flex text-amber-400 mb-2">
                    <Star className="w-5 h-5" />
                    <Star className="w-5 h-5" />
                    <Star className="w-5 h-5" />
                    <Star className="w-5 h-5" />
                    <Star className="w-5 h-5" />
                  </div>
                  <p className="text-gray-700 text-sm mb-4">
                    {item === 1 && "Grâce aux alertes Premium, je reçois instantanément les notifications pour les produits que je recherche. J'ai pu acheter du thiof frais avant même qu'il ne soit affiché sur le marché!".split(' ').slice(0, 20).join(' ') + '...'}
                    {item === 2 && "Le service client Premium est exceptionnel. Mes commandes sont toujours traitées en priorité et j'ai accès à des produits de qualité supérieure.".split(' ').slice(0, 20).join(' ') + '...'}
                    {item === 3 && "L'abonnement Premium a changé ma façon d'acheter. Je ne manque plus jamais les meilleures prises et j'économise du temps et de l'argent.".split(' ').slice(0, 20).join(' ') + '...'}
                  </p>
                  <div className="d-flex align-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Acheteur {item}
                      </p>
                      <p className="text-xs text-gray-500">Dakar, Sénégal</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              {
                question: 'Comment puis-je payer mon abonnement Premium?',
                reponse: 'Vous pouvez payer via Mobile Money, carte bancaire ou virement. Le paiement est sécurisé et instantané.'
              },
              {
                question: 'Mon abonnement se renouvelle-t-il automatiquement?',
                reponse: 'Non, votre abonnement ne se renouvelle pas automatiquement. Vous serez notifié avant la fin de votre période d\'abonnements.'
              },
              {
                question: 'Puis-je annuler mon abonnement à tout moment?',
                reponse: 'Oui, vous pouvez annuler votre abonnement à tout moment depuis votre compte. Vous conserverez vos avantages jusqu\'à la fin de la période payée.'
              },
              {
                question: 'Que se passe-t-il si je ne reçois pas de notification?',
                reponse: 'Assurez-vous que votre numéro de téléphone est correct et que vous avez bien configuré vos alertes. Contactez notre support si le problème persiste.'
              }
            ].map((faq, index) => (
              <details key={index} className="border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  {faq.question}
                </summary>
                <p className="text-gray-600 text-sm mt-3">{faq.reponse}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/acheteur/accueil')}
            className="d-flex align-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au marché</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
