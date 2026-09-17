import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Anchor, Bell, Check, CheckCircle, Fish, LayoutGrid, MapPin, Minus,
  Package, Play, Plus, Search, ShoppingBag, ShoppingCart, SlidersHorizontal,
  Star, Waves, X, Store, ChevronLeft, Trash2, Smartphone, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommandes } from '../../context/CommandeContext';
import { usePublications } from '../../context/PublicationContext';
import UserMenu from '../../components/UserMenu';
import AcheteurBottomNav from '../../components/AcheteurBottomNav';

const locations = [
  { id: 'tous', name: 'Toutes les zones', icon: Waves },
  { id: 'soumbedioune', name: 'Soumbédioune', icon: Anchor },
  { id: 'yoff', name: 'Yoff', icon: MapPin },
  { id: 'kayar', name: 'Kayar', icon: MapPin },
  { id: 'hann', name: 'Hann', icon: MapPin },
];

const categories = [
  { id: 'tous', name: 'Tous les arrivages', icon: LayoutGrid },
  { id: 'poisson', name: 'Poissons' },
  { id: 'fruit_de_mer', name: 'Fruits de mer' },
];

const fallbackImage = 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=800&q=80';

const formatPrice = (price) => `${new Intl.NumberFormat('fr-FR').format(Number(price) || 0)} FCFA`;

const getSellerName = (product) => {
  const nestedName = `${product.pecheur?.prenom || ''} ${product.pecheur?.nom || ''}`.trim();
  return nestedName || `${product.pecheur_prenom || ''} ${product.pecheur_nom || ''}`.trim() || 'Pêcheur Lebougui';
};

const getSellerInitial = (name) => name.charAt(0).toUpperCase();

export default function AcheteurDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { utilisateur } = useAuth();
  const { publications, chargerPublications } = usePublications();
  const { mesCommandes, passerCommande } = useCommandes();

  // Clé LocalStorage isolée par identifiant acheteur
  const cartStorageKey = utilisateur?.id ? `panier_acheteur_${utilisateur.id}` : 'panier_acheteur_guest';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('tous');
  const [selectedCategory, setSelectedCategory] = useState('tous');

  // Initialisation du panier
  const [panier, setPanier] = useState(() => {
    try {
      const key = utilisateur?.id ? `panier_acheteur_${utilisateur.id}` : 'panier_acheteur_guest';
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRef = useRef(null);

  // ÉTATS DU MODAL PANIER/PAIEMENT STATIQUE
  const [isPanierModalOpen, setIsPanierModalOpen] = useState(false);
  const [fraisLivraison] = useState(1500);
  const [moyenPaiement, setMoyenPaiement] = useState('wave');
  const [numeroTelephone, setNumeroTelephone] = useState(() => utilisateur?.telephone || '770000000');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/connexion');
      return;
    }
    chargerPublications();
  }, [chargerPublications, navigate]);

  useEffect(() => {
    if (cartStorageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
        setPanier(saved);
      } catch {
        setPanier([]);
      }
    }
  }, [cartStorageKey]);

  useEffect(() => {
    if (cartStorageKey) {
      localStorage.setItem(cartStorageKey, JSON.stringify(panier));
    }
  }, [panier, cartStorageKey]);

  useEffect(() => () => audioRef.current?.pause(), []);

  const showFeedback = (message) => {
    setToastMessage(message);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 3000);
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (publications.produits || []).filter((product) => {
      const searchable = `${product.nom || ''} ${product.categorie || ''} ${product.adresse || ''} ${product.description || ''}`.toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const matchesLocation = selectedLocation === 'tous' || product.adresse?.toLowerCase().includes(selectedLocation);
      const matchesCategory = selectedCategory === 'tous' || product.categorie === selectedCategory;
      return matchesQuery && matchesLocation && matchesCategory;
    });
  }, [publications.produits, searchQuery, selectedCategory, selectedLocation]);

  const cartCount = panier.length;

  // Calcul du sous-total et du total pour le panier
  const sousTotal = panier.reduce((acc, item) => acc + (Number(item.prix) * Number(item.quantite)), 0);
  const totalPanier = sousTotal > 0 ? sousTotal + fraisLivraison : 0;

  // Ajouter au panier sans ouvrir le modal
  const addToCart = (product) => {
    const existingProduct = panier.find((item) => item.id === product.id);

    if (existingProduct) {
      showFeedback("Ce produit est déjà dans votre panier.");
      return;
    }

    const newItem = {
      id: product.id,
      nom: product.nom,
      prix: Number(product.prix) || 0,
      quantite: 1,
      image: product.media || product.image || fallbackImage,
      unite: product.unite || 'kg',
      adresse: product.adresse || 'Dakar',
    };

    setPanier((current) => [...current, newItem]);
    showFeedback(`${product.nom} ajouté au panier !`);
  };

  // Clic sur "Commander" : Ajoute le produit s'il n'y est pas, puis ouvre le popup
  const handleCommanderDirect = (product) => {
    const existingProduct = panier.find((item) => item.id === product.id);
    if (!existingProduct) {
      const newItem = {
        id: product.id,
        nom: product.nom,
        prix: Number(product.prix) || 0,
        quantite: 1,
        image: product.media || product.image || fallbackImage,
        unite: product.unite || 'kg',
        adresse: product.adresse || 'Dakar',
      };
      setPanier((current) => [...current, newItem]);
    }
    setIsPanierModalOpen(true);
  };

  // Gestion des quantités dans le panier modal
  const augmenterQuantite = (id) => {
    setPanier((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantite: item.quantite + 1 } : item))
    );
  };

  const diminuerQuantite = (id) => {
    setPanier((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantite: item.quantite - 1 } : item))
        .filter((item) => item.quantite > 0)
    );
  };

  const retirerProduit = (id) => {
    setPanier((prev) => prev.filter((item) => item.id !== id));
  };

  const viderPanier = () => {
    setPanier([]);
    localStorage.removeItem(cartStorageKey);
  };

  // Confirmation de la commande statique dans le popup
  const validerCommandeStatique = async () => {
    if (panier.length === 0) return;
    setIsOrdering(true);

    try {
      for (const item of panier) {
        await passerCommande(item.id, item.quantite);
      }

      const methodeNom = moyenPaiement === 'wave' ? 'Wave' : 'Orange Money';
      viderPanier();
      setIsPanierModalOpen(false);
      showFeedback(`Commande transmise via ${methodeNom} (${numeroTelephone}) !`);

      setTimeout(() => {
        navigate('/acheteur/commandes');
      }, 1500);
    } catch (error) {
      showFeedback('Erreur lors de la validation.');
    } finally {
      setIsOrdering(false);
    }
  };

  const playAudio = (product) => {
    if (!product.audio) {
      showFeedback('Aucune note vocale disponible pour ce produit');
      return;
    }
    if (playingAudioId === product.id) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(product.audio);
    audioRef.current = audio;
    audio.onended = () => setPlayingAudioId(null);
    audio.onerror = () => {
      setPlayingAudioId(null);
      showFeedback('Lecture de la note vocale impossible');
    };
    audio.play().then(() => setPlayingAudioId(product.id)).catch(() => showFeedback('Lecture de la note vocale impossible'));
  };

  const formatCategory = (category) => category === 'fruit_de_mer' ? 'Fruit de mer' : 'Poisson';

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">
        <main className="no-scrollbar h-full overflow-y-auto px-4 pb-24 pt-5">
          
          {/* HEADER */}
          <header className="flex items-center justify-between pb-1">
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold leading-tight text-stone-900">
                  {utilisateur?.prenom ? `Chez ${utilisateur.prenom}` : 'Marché Lebougui'}
                </h1>
                {utilisateur?.status_premium?.statut === 'actif' && (
                  <span className="rounded-md bg-cyan-100 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-800">
                    PRO
                  </span>
                )}
              </div>
              <p className="flex items-center gap-1 text-[11px] font-medium text-stone-500">
                <MapPin size={12} className="text-stone-400" /> Dakar · Plateau
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPanierModalOpen(true)}
                aria-label={`Panier, ${cartCount} articles`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-stone-800 shadow-sm transition hover:bg-white"
              >
                <ShoppingBag size={17} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#FAF6F0] bg-[#FF6B4A] text-[10px] font-black text-white">
                    {cartCount}
                  </span>
                )}
              </button>

              <UserMenu
                photo={utilisateur?.photo}
                prenom={utilisateur?.prenom}
                nom={utilisateur?.nom}
                role="Acheteur"
                showName={false}
              />
            </div>
          </header>

          {/* FILTRES LIEUX */}
          <section className="no-scrollbar flex gap-2 overflow-x-auto py-4">
            {locations.map(({ id, name, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setSelectedLocation(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-sm transition ${
                  selectedLocation === id
                    ? 'bg-[#0C3B4A] text-white'
                    : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
                }`}
              >
                <Icon size={14} className={selectedLocation === id ? 'text-cyan-300' : 'text-stone-500'} />
                {name}
              </button>
            ))}
          </section>

          {/* BARRE DE RECHERCHE */}
          <section className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                id="market-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                type="search"
                placeholder="Rechercher thiof, yaboye, poulpe..."
                className="w-full rounded-2xl border-0 bg-white py-2.5 pl-10 pr-4 text-xs text-stone-800 shadow-sm outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-[#0C3B4A]/20"
              />
            </div>
            <button
              type="button"
              aria-label="Filtres"
              onClick={() => setSelectedCategory(selectedCategory === 'tous' ? 'poisson' : 'tous')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-600 shadow-sm hover:bg-stone-50"
            >
              <SlidersHorizontal size={16} />
            </button>
          </section>

          {/* CATEGORIES */}
          <section className="no-scrollbar flex gap-2 overflow-x-auto pb-4 pt-3">
            {categories.map(({ id, name }) => (
              <button
                type="button"
                key={id}
                onClick={() => setSelectedCategory(id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm transition ${
                  selectedCategory === id
                    ? 'bg-[#0C3B4A] text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-100'
                }`}
              >
                {name}
              </button>
            ))}
          </section>

          {/* LISTE DES PRODUITS */}
          <section className="space-y-4">
            {publications.chargement ? (
              <div className="py-12 text-center text-sm text-stone-500">Chargement des arrivages...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Fish size={38} className="mx-auto mb-3 text-stone-300" />
                <p className="text-sm font-semibold text-stone-700">Aucun produit trouvé</p>
                <p className="mt-1 text-xs text-stone-500">Modifiez votre recherche ou vos filtres.</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const sellerName = getSellerName(product);
                const isPlaying = playingAudioId === product.id;
                const isInCart = panier.some((item) => item.id === product.id);

                return (
                  <article key={product.id} className="space-y-3 rounded-3xl border border-stone-100 bg-white p-3 shadow-sm">
                    <button
                      type="button"
                      onClick={() => navigate(`/acheteur/produit/${product.id}`)}
                      className="relative block h-44 w-full overflow-hidden rounded-2xl bg-stone-200 text-left"
                    >
                      <img src={product.media || product.image || fallbackImage} alt={product.nom} className="h-full w-full object-cover" />
                      <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                        <MapPin size={12} className="text-cyan-300" />
                        {product.adresse || 'Soumbédioune'}
                      </span>
                    </button>

                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-base font-extrabold leading-snug text-stone-900">{product.nom}</h2>
                        <p className="text-xs font-medium text-stone-500">
                          {product.description || `Pêche du jour · ${formatCategory(product.categorie)}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        aria-label={`Ajouter ${product.nom} au panier`}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-sm transition active:scale-95 ${
                          isInCart 
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                            : 'bg-orange-100/70 text-orange-700 hover:bg-orange-200'
                        }`}
                      >
                        {isInCart ? <Check size={16} /> : <Plus size={16} />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 p-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0C3B4A] text-xs font-bold text-white">
                          {product.pecheur?.photo ? (
                            <img src={product.pecheur.photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            getSellerInitial(sellerName)
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold text-stone-800">{sellerName}</span>
                          {product.pecheur?.est_premium && (
                            <span className="block text-[9px] font-bold text-emerald-600">Pêcheur vérifié</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => playAudio(product)}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white px-2.5 py-1 text-[11px] font-bold text-stone-700 shadow-sm transition hover:bg-stone-100"
                      >
                        {isPlaying ? (
                          <span className="flex h-3 items-end gap-0.5">
                            <span className="h-2 w-0.5 animate-pulse bg-[#FF6B4A]" />
                            <span className="h-3 w-0.5 animate-pulse bg-[#FF6B4A]" />
                            <span className="h-1.5 w-0.5 animate-pulse bg-[#FF6B4A]" />
                          </span>
                        ) : (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500/10 text-[#FF6B4A]">
                            <Play size={10} fill="currentColor" />
                          </span>
                        )}
                        Note vocale
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400">PRIX DIRECT</span>
                        <p className="text-base font-black text-stone-900">
                          {formatPrice(product.prix)} <span className="text-xs font-medium text-stone-500">/ {product.unite || 'kg'}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCommanderDirect(product)}
                        className="flex items-center gap-2 rounded-2xl bg-[#FF6B4A] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E85A39] active:scale-95"
                      >
                        <ShoppingCart size={15} />
                        Commander
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </main>

        {/* FOOTER DE NAVIGATION */}
        <nav className="absolute bottom-3 left-4 right-4 z-30 flex items-center justify-between rounded-full border border-stone-200/60 bg-white/95 px-5 py-2.5 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => navigate('/acheteur/accueil')}
            className={`flex flex-col items-center gap-0.5 transition ${
              location.pathname.includes('/marche') || location.pathname.includes('/accueil')
                ? 'font-extrabold text-[#0C3B4A]'
                : 'font-medium text-stone-400 hover:text-stone-700'
            }`}
          >
            <Store size={19} />
            <span className="text-[10px]">Marché</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/acheteur/commandes')}
            className={`flex flex-col items-center gap-0.5 transition ${
              location.pathname.includes('/commandes')
                ? 'font-extrabold text-[#0C3B4A]'
                : 'font-medium text-stone-400 hover:text-stone-700'
            }`}
          >
            <Package size={19} />
            <span className="text-[10px]">Commandes</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/acheteur/alertes')}
            className={`relative flex flex-col items-center gap-0.5 transition ${
              location.pathname.includes('/alertes')
                ? 'font-extrabold text-[#0C3B4A]'
                : 'font-medium text-stone-400 hover:text-stone-700'
            }`}
          >
            <Bell size={19} />
            {mesCommandes?.liste?.some((order) => order.statut === 'en_attente') && (
              <span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-[#FF6B4A]" />
            )}
            <span className="text-[10px]">Alertes</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/acheteur/premium')}
            className={`flex flex-col items-center gap-0.5 transition ${
              location.pathname.includes('/premium')
                ? 'font-extrabold text-[#0C3B4A]'
                : 'font-medium text-stone-400 hover:text-stone-700'
            }`}
          >
            <Star size={19} />
            <span className="text-[10px]">Premium</span>
          </button>
        </nav>

        {/* TOAST FEEDBACK */}
        {showToast && (
          <div className="absolute left-1/2 top-16 z-50 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-2xl bg-stone-900/95 px-4 py-3 text-center text-xs font-bold text-white shadow-2xl backdrop-blur-sm animate-fade-in">
            <CheckCircle size={16} className="shrink-0 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* POPUP PANIER & PAIEMENT (EXACTEMENT COMME L'IMAGE) */}
        {isPanierModalOpen && (
          <div className="absolute inset-0 z-50 flex flex-col bg-[#FAF6F0] animate-in slide-in-from-bottom duration-300">
            
            {/* HEADER DU POPUP */}
            <header className="flex items-center justify-between px-5 pt-6 pb-2">
              <button
                type="button"
                onClick={() => setIsPanierModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-800 shadow-sm transition active:scale-95"
              >
                <ChevronLeft size={20} />
              </button>
              
              <h1 className="text-lg font-extrabold text-[#0C3B4A]">Mon Panier</h1>

              {panier.length > 0 ? (
                <button
                  type="button"
                  onClick={viderPanier}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition"
                >
                  Vider le panier
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPanierModalOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-800 shadow-sm"
                >
                  <Search size={18} />
                </button>
              )}
            </header>

            {/* CORPS DU POPUP */}
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28 pt-2">
              {panier.length === 0 ? (
                <div className="mt-20 text-center">
                  <ShoppingBag size={48} className="mx-auto mb-3 text-stone-300" />
                  <p className="text-base font-bold text-stone-700">Votre panier est vide</p>
                  <p className="mt-1 text-xs text-stone-400">Découvrez nos arrivages frais sur le marché.</p>
                  <button
                    type="button"
                    onClick={() => setIsPanierModalOpen(false)}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#0C3B4A] px-5 py-2.5 text-xs font-bold text-white shadow-md"
                  >
                    Retour au marché
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* LISTE DES ARTICLES DANS LE PANIER */}
                  {panier.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm border border-stone-100/80"
                    >
                      <img
                        src={item.image}
                        alt={item.nom}
                        className="h-20 w-20 rounded-2xl object-cover shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-extrabold text-stone-900 truncate">{item.nom}</h3>
                          <button
                            type="button"
                            onClick={() => retirerProduit(item.id)}
                            className="text-stone-300 hover:text-rose-500 transition p-0.5"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        
                        <p className="text-[11px] font-medium text-stone-400 mt-0.5">
                          {formatPrice(item.prix)} / {item.unite || 'kg'}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5 rounded-xl bg-stone-100/80 px-2.5 py-1">
                            <button
                              type="button"
                              onClick={() => diminuerQuantite(item.id)}
                              className="text-stone-600 hover:text-stone-900"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-black text-stone-800">
                              {item.quantite} {item.unite || 'kg'}
                            </span>
                            <button
                              type="button"
                              onClick={() => augmenterQuantite(item.id)}
                              className="text-stone-600 hover:text-stone-900"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <span className="text-sm font-black text-stone-900">
                            {formatPrice(item.prix * item.quantite)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* RÉSUMÉ DE LA COMMANDE */}
                  <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm border border-stone-100 space-y-3">
                    <h2 className="text-base font-extrabold text-[#0C3B4A]">Résumé de la commande</h2>
                    
                    <div className="flex justify-between text-xs font-medium text-stone-500 pt-1">
                      <span>Sous-total</span>
                      <span className="font-bold text-stone-800">{formatPrice(sousTotal)}</span>
                    </div>

                    <div className="flex justify-between text-xs font-medium text-stone-500">
                      <span>Livraison</span>
                      <span className="font-bold text-emerald-600">{formatPrice(fraisLivraison)}</span>
                    </div>

                    <div className="border-t border-stone-100 pt-3 flex justify-between items-center">
                      <span className="text-sm font-extrabold text-stone-900">Total</span>
                      <span className="text-lg font-black text-[#FF6B4A]">{formatPrice(totalPanier)}</span>
                    </div>
                  </div>

                  {/* MOYEN DE PAIEMENT MOBILE */}
                  <div className="mt-5 space-y-3">
                    <h3 className="text-xs font-bold text-stone-900">Moyen de paiement mobile</h3>

                    {/* WAVE */}
                    <div
                      onClick={() => setMoyenPaiement('wave')}
                      className={`relative flex items-center justify-between rounded-2xl p-3.5 cursor-pointer transition border ${
                        moyenPaiement === 'wave'
                          ? 'bg-[#E3F6F5] border-[#13B5EA]'
                          : 'bg-white border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#13B5EA] text-white font-black text-xs shadow-sm">
                          W
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-stone-900">Wave</span>
                            <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-700">0% frais</span>
                          </div>
                          <p className="text-xs font-medium text-stone-500">
                            +221 {numeroTelephone}
                          </p>
                        </div>
                      </div>

                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        moyenPaiement === 'wave'
                          ? 'bg-[#004D40] border-[#004D40] text-white'
                          : 'border-stone-300 bg-white'
                      }`}>
                        {moyenPaiement === 'wave' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>

                    {/* ORANGE MONEY */}
                    <div
                      onClick={() => setMoyenPaiement('om')}
                      className={`relative flex items-center justify-between rounded-2xl p-3.5 cursor-pointer transition border ${
                        moyenPaiement === 'om'
                          ? 'bg-[#FFF3E0] border-[#FF6600]'
                          : 'bg-white border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6600] text-white font-black text-xs shadow-sm">
                          OM
                        </div>
                        <div>
                          <span className="text-sm font-black text-stone-900 block">Orange Money</span>
                          <p className="text-xs font-medium text-stone-500">
                            +221 {numeroTelephone}
                          </p>
                        </div>
                      </div>

                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        moyenPaiement === 'om'
                          ? 'bg-[#FF6600] border-[#FF6600] text-white'
                          : 'border-stone-300 bg-white'
                      }`}>
                        {moyenPaiement === 'om' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>

                    {/* NUMÉRO DE TÉLÉPHONE */}
                    <div className="pt-1">
                      {!isEditingPhone ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingPhone(true)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-[#0C3B4A] hover:underline"
                        >
                          <Smartphone size={13} />
                          Changer le numéro ({numeroTelephone})
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 rounded-xl bg-white p-2 border border-stone-200">
                          <span className="text-xs font-bold text-stone-500 pl-2">+221</span>
                          <input
                            type="tel"
                            value={numeroTelephone}
                            onChange={(e) => setNumeroTelephone(e.target.value)}
                            placeholder="77 000 00 00"
                            className="w-full text-xs font-bold text-stone-800 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setIsEditingPhone(false)}
                            className="rounded-lg bg-[#0C3B4A] px-2.5 py-1 text-[10px] font-bold text-white shrink-0"
                          >
                            OK
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}
            </div>

            {/* BOUTON CONFIRMER LA COMMANDE */}
            {panier.length > 0 && (
              <div className="absolute bottom-16 left-4 right-4 z-20">
                <button
                  type="button"
                  disabled={isOrdering}
                  onClick={validerCommandeStatique}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#E85A39] active:scale-95 disabled:opacity-60"
                >
                  <ShoppingBag size={18} />
                  {isOrdering ? 'Validation...' : 'Confirmer la commande'}
                </button>
              </div>
            )}

         <AcheteurBottomNav/>

          </div>
        )}

      </div>
    </div>
  );
}