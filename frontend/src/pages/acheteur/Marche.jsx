import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Bell, Star, ShoppingCart, Search, SlidersHorizontal, 
  MapPin, Anchor, User, Clock, CheckCircle, Plus, Fish, Home, LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePublications } from '../../context/PublicationContext';
import { useCommandes } from '../../context/CommandeContext';

// Style pour masquer la barre de défilement
const noScrollbar = {
  WebkitScrollbar: 'none',
  MsOverflowStyle: 'none',
  scrollbarWidth: 'none',
};

// Filtres de localisation
const locations = [
  { id: 'soumbedioune', name: 'Soumbédioune', icon: Anchor },
  { id: 'yoff', name: 'Yoff', icon: MapPin },
  { id: 'kayar', name: 'Kayar', icon: MapPin },
  { id: 'hann', name: 'Hann', icon: MapPin },
];

// Filtres de catégorie
const categories = [
  { id: 'tous', name: 'Tous les arrivages', icon: LayoutGrid },
  { id: 'poissons', name: 'Poissons' },
  { id: 'fruits_mer', name: 'Fruits de mer' },
];

// Composant de chargement simple
const SimpleSpinner = () => (
  <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
);

export default function Marche() {
  const navigate = useNavigate();
  const { estAuthentifie, utilisateur } = useAuth();
  const { publications, chargerPublications } = usePublications();
  const { mesCommandes } = useCommandes();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('soumbedioune');
  const [selectedCategory, setSelectedCategory] = useState('tous');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [chargement, setChargement] = useState(true);

  // Panier local
  const [panier, setPanier] = useState(() => {
    const saved = localStorage.getItem('panier_acheteur');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('panier_acheteur', JSON.stringify(panier));
  }, [panier]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/connexion');
      return;
    }
    
    if (estAuthentifie()) {
      chargerPublications().finally(() => setChargement(false));
    } else {
      setChargement(false);
    }
  }, [navigate, estAuthentifie, chargerPublications]);

  // Formatage du prix
  const formaterPrix = (prix) => {
    return new Intl.NumberFormat('fr-FR').format(prix || 0);
  };

  // Filtrer les produits
  const filteredProducts = publications.produits
    .filter(produit => {
      const matchesSearch = produit.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        produit.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        produit.categorie?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLocation = selectedLocation === 'soumbedioune' || 
        (produit.adresse && produit.adresse.toLowerCase().includes(selectedLocation));
      
      const matchesCategory = selectedCategory === 'tous' || 
        (produit.categorie && produit.categorie.replace('_', '') === selectedCategory);
      
      return matchesSearch && matchesLocation && matchesCategory;
    });

  // Ajouter au panier
  const ajouterAuPanier = (produit) => {
    const newItem = { ...produit, quantite: 1 };
    setPanier(prev => {
      const exists = prev.find(item => item.id === produit.id);
      if (exists) {
        return prev.map(item => 
          item.id === produit.id ? { ...item, quantite: (item.quantite || 0) + 1 } : item
        );
      }
      return [...prev, newItem];
    });
    
    setToastMessage(`${produit.nom} ajouté au panier !`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Obtenir l'icône de lieu
  const getLocationIcon = (lieu) => {
    if (!lieu) return Anchor;
    if (lieu.toLowerCase().includes('soumbedioune') || lieu.toLowerCase().includes('port') || lieu.toLowerCase().includes('quai')) {
      return Anchor;
    }
    return MapPin;
  };

  // Nombre d'articles dans le panier
  const getPanierCount = () => {
    return panier.reduce((total, item) => total + (item.quantite || 0), 0);
  };

  return (
    <div 
      className="min-h-screen bg-stone-200 flex items-center justify-center font-sans antialiased sm:py-6"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
    >
      
      {/* Conteneur principal style smartphone */}
      <div 
        className="w-full max-w-md bg-[#FAF7F2] min-h-screen sm:min-h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:shadow-2xl overflow-y-auto relative flex flex-col justify-between border-stone-300 sm:border-8"
      >
        
        {/* ==================== HEADER ==================== */}
        <header className="sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md pt-4 px-4 pb-2">
          
          {/* Ligne 1: Profil + Actions */}
          <div className="flex items-center justify-between">
            {/* Profil Utilisateur */}
            <div className="flex items-center gap-2.5">
              <div 
                className="w-10 h-10 rounded-full bg-[#0F2C3D] flex items-center justify-center text-white shadow-sm"
              >
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-stone-900 text-base leading-tight">
                    {utilisateur?.prenom || 'Chez Loutcha'}
                  </h1>
                  {utilisateur?.est_premium && (
                    <span 
                      className="bg-[#29D0B0]/20 text-[#29D0B0] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                    >
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-stone-500 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-400" />
                  Dakar • Plateau
                </p>
              </div>
            </div>

            {/* Boutons d'action droite */}
            <div className="flex items-center gap-2">
              <button 
                className="w-10 h-10 rounded-full bg-stone-200/70 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                id="cartBtn"
                className="relative flex flex-col items-center justify-center pl-1 pr-2 py-1"
                onClick={() => navigate('/acheteur/panier')}
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-stone-800" />
                  {getPanierCount() > 0 && (
                    <span 
                      id="cartBadge"
                      className="absolute -top-1.5 -right-2 bg-[#FF6B35] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#FAF7F2]"
                    >
                      {getPanierCount()}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-stone-700 mt-0.5">Panier</span>
              </button>
            </div>
          </div>

          {/* Filtre de localisation (Scroll horizontal) */}
          <div 
            className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-4 pb-2 -mx-4 px-4"
            style={noScrollbar}
          >
            {locations.map(loc => {
              const Icon = loc.icon;
              const isActive = selectedLocation === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shadow-sm transition ${
                    isActive 
                      ? 'bg-[#0F2C3D] text-white' 
                      : 'bg-stone-200/70 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-stone-500'}`} />
                  {loc.name}
                </button>
              );
            })}
          </div>

          {/* Champ de Recherche & Bouton Filtre */}
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher thiof, yaboye, poulpe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-stone-800 text-xs pl-9 pr-4 py-2.5 rounded-xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-[#005F60]/30 shadow-sm placeholder:text-stone-400"
              />
            </div>
            <button 
              className="w-10 h-10 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 shadow-sm hover:bg-stone-50 transition"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Filtres par catégorie */}
          <div 
            className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 pb-1 -mx-4 px-4"
            style={noScrollbar}
          >
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    isActive 
                      ? 'bg-[#005F60] text-white shadow-sm' 
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/60'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </header>

        
        {/* ==================== MAIN - Liste des Produits ==================== */}
        <main className="flex-1 px-4 py-3 space-y-4 pb-24">
          
          {chargement ? (
            <div className="flex items-center justify-center py-12">
              <SimpleSpinner />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fish className="text-stone-400 w-10 h-10" />
              </div>
              <h3 className="font-semibold text-stone-800 mb-2">Aucun produit trouvé</h3>
              <p className="text-stone-600 text-sm">
                Essayez de modifier vos filtres
              </p>
            </div>
          ) : (
            filteredProducts.map((produit) => {
              const LocationIcon = getLocationIcon(produit.adresse);
              const prix = parseInt(produit.prix) || 0;
              const estPoisson = produit.categorie === 'poisson' || produit.categorie === 'poissons';
              const unite = produit.unite || (estPoisson ? 'kg' : 'kg');
              const labelPrix = estPoisson ? 'PRIX AU KG' : `PRIX PAR ${unite.toUpperCase()}`;
              
              return (
                <div 
                  key={produit.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 transition hover:shadow-md"
                >
                  {/* Image avec Badge Lieu */}
                  <div className="relative h-44 w-full bg-stone-100">
                    <img
                      src={produit.media || produit.image || 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=800&q=80'}
                      alt={produit.nom}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-[#0F2C3D]/80 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <LocationIcon className="w-3 h-3 text-cyan-300" />
                      {produit.adresse || 'Soumbédioune • Quai 2'}
                    </div>
                  </div>

                  {/* Contenu Card */}
                  <div className="p-3.5">
                    {/* En-tête: Titre + Bouton Plus */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-bold text-stone-900 text-base leading-snug">
                          {produit.nom}
                        </h2>
                        <p className="text-stone-500 text-xs mt-0.5">
                          {produit.description || 'Pêche du jour • Qualité Luxe'}
                        </p>
                      </div>
                      <button 
                        className="w-7 h-7 rounded-lg bg-[#FFF0EA] text-[#FF6B35] flex items-center justify-center font-bold hover:bg-[#FF6B35] hover:text-white transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Pêcheur & Horaires */}
                    <div className="mt-3 bg-stone-50 rounded-xl p-2 flex items-center justify-between border border-stone-100">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-7 h-7 rounded-full bg-[#0F2C3D] text-white flex items-center justify-center text-xs font-bold"
                        >
                          {produit.pecheur?.photo ? (
                            <img 
                              src={produit.pecheur.photo} 
                              alt={produit.pecheur.prenom}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-stone-800 block leading-tight">
                            {produit.pecheur?.prenom} {produit.pecheur?.nom}
                          </span>
                          {produit.pecheur?.est_premium && (
                            <span className="text-[10px] text-stone-400 block">Pêcheur Premium</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-stone-200/60 text-stone-600 text-[11px] font-medium">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {produit.date_publication ? new Date(produit.date_publication).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) : '0:15'}
                      </div>
                    </div>

                    {/* Prix & CTA */}
                    <div className="mt-3.5 flex items-end justify-between pt-1">
                      <div>
                        <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase block">
                          {labelPrix}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-stone-900">{formaterPrix(prix)}</span>
                          <span className="text-xs font-bold text-stone-600">FCFA / {unite}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => ajouterAuPanier(produit)}
                        className="bg-[#FF6B35] hover:bg-[#E85A26] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#FF6B35]/20 transition active:scale-95"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Commander
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>

        
        {/* ==================== BOTTOM NAVIGATION ==================== */}
        <nav className="sticky bottom-0 z-30 bg-white border-t border-stone-200/80 px-6 py-2 flex items-center justify-between sm:rounded-b-[32px]">
          
          {/* Onglet Marché (actif) */}
          <button 
            className="flex flex-col items-center gap-1 text-[#005F60] font-bold"
            onClick={() => navigate('/acheteur/marche')}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px]">Marché</span>
          </button>

          {/* Onglet Commandes */}
          <button 
            className="flex flex-col items-center gap-1 text-stone-400 hover:text-stone-700 font-medium transition"
            onClick={() => navigate('/acheteur/commandes')}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[11px]">Commandes</span>
          </button>

          {/* Onglet Alertes */}
          <button 
            className="flex flex-col items-center gap-1 text-stone-400 hover:text-stone-700 font-medium relative transition"
            onClick={() => navigate('/acheteur/alertes')}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {mesCommandes.liste.filter(c => c.statut === 'en_attente').length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#FF6B35]"></span>
              )}
            </div>
            <span className="text-[11px]">Alertes</span>
          </button>

          {/* Onglet Premium */}
          <button 
            className="flex flex-col items-center gap-1 text-stone-400 hover:text-stone-700 font-medium transition"
            onClick={() => navigate('/acheteur/premium')}
          >
            <Star className="w-5 h-5" />
            <span className="text-[11px]">Premium</span>
          </button>
        </nav>

        
        {/* ==================== TOAST NOTIFICATION ==================== */}
        {showToast && (
          <div 
            className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-4 py-2.5 rounded-full text-xs font-medium shadow-lg opacity-100 pointer-events-auto transition-all duration-300 flex items-center gap-2 z-50"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
