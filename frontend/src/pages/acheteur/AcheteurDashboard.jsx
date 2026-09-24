import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor, ArrowUpRight, BadgeCheck, Check, CheckCircle, Fish,
  LayoutGrid, MapPin, Pause, Play, Plus, Waves,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePublications } from '../../context/PublicationContext';
import { useAudio } from '../../context/AudioContext';
import AcheteurHeader from '../../components/AcheteurHeader';
import AcheteurBottomNav from '../../components/AcheteurBottomNav';

const locations = [
  { id: 'tous', name: 'Toute la côte', icon: Waves },
  { id: 'soumbedioune', name: 'Soumbédioune', icon: Anchor },
  { id: 'yoff', name: 'Yoff', icon: MapPin },
  { id: 'kayar', name: 'Kayar', icon: MapPin },
  { id: 'hann', name: 'Hann', icon: MapPin },
];

const categories = [
  { id: 'tous', name: 'Tout', icon: LayoutGrid },
  { id: 'poisson', name: 'Poissons' },
  { id: 'fruit_de_mer', name: 'Fruits de mer' },
];

const fallbackImage = '/images/fallback.png';
const formatPrice = (price) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(price) || 0)} FCFA`;

const estDisponible = (product) => (product.statut ?? 'disponible') === 'disponible';

const getSellerName = (product) => {
  const nestedName = `${product.pecheur?.prenom || ''} ${product.pecheur?.nom || ''}`.trim();
  return (
    nestedName ||
    `${product.pecheur_prenom || ''} ${product.pecheur_nom || ''}`.trim() ||
    'Pêcheur Lebougui'
  );
};

const getSellerInitial = (name) => name.charAt(0).toUpperCase();

export default function AcheteurDashboard() {
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const { publications, chargerPublications } = usePublications();
  const { currentId: audioEnCours, play: playAudio, pause: pauseAudio } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('tous');
  const [selectedCategory, setSelectedCategory] = useState('tous');

  const [panier, setPanier] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const cartKey = utilisateur?.id
    ? `panier_acheteur_${utilisateur.id}`
    : 'panier_acheteur_guest';

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/connexion');
      return;
    }
    chargerPublications(true);
  }, [chargerPublications, navigate]);

  useEffect(() => {
    if (!cartKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || '[]');
      setPanier(Array.isArray(saved) ? saved : []);
    } catch {
      setPanier([]);
    }
  }, [cartKey]);

  const showFeedback = (message) => {
    setToastMessage(message);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2000);
  };

  const saveCartToStorage = (updatedCart) => {
    setPanier(updatedCart);
    try {
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
      // notifie les autres composants (header, etc.)
      window.dispatchEvent(new Event('cart:update'));
    } catch (e) {
      console.error('Erreur sauvegarde panier:', e);
    }
  };

  const toggleAudio = (product) => {
    if (!product.audio) {
      showFeedback('Aucune note vocale disponible pour ce produit');
      return;
    }
    const id = `prod-${product.id}`;
    if (audioEnCours === id) {
      pauseAudio();
    } else {
      playAudio(id, product.audio);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (publications.produits || []).filter((product) => {
      const searchable = `${product.nom || ''} ${product.categorie || ''} ${product.adresse || ''} ${product.description || ''}`.toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const matchesLocation =
        selectedLocation === 'tous' ||
        product.adresse?.toLowerCase().includes(selectedLocation);
      const matchesCategory =
        selectedCategory === 'tous' || product.categorie === selectedCategory;
      return matchesQuery && matchesLocation && matchesCategory;
    });
  }, [publications.produits, searchQuery, selectedCategory, selectedLocation]);

  const cartCount = panier.reduce((t, i) => t + Number(i.quantite || 0), 0);

  const handlePlusClick = (product) => {
    if (!estDisponible(product)) {
      showFeedback(`${product.nom} n'est plus disponible`);
      return;
    }
    let current = [];
    try {
      current = JSON.parse(localStorage.getItem(cartKey) || '[]');
    } catch {
      current = [];
    }
    const exists = current.some((item) => String(item.id) === String(product.id));
    if (exists) {
      showFeedback('Ce produit est déjà dans le panier');
      return;
    }
    const updated = [
      ...current,
      {
        id: product.id,
        nom: product.nom,
        prix: Number(product.prix) || 0,
        quantite: 1,
        image: product.media || product.image || fallbackImage,
        unite: product.unite || 'kg',
        adresse: product.adresse || 'Dakar',
      },
    ];
    saveCartToStorage(updated);
    showFeedback(`${product.nom} ajouté au panier`);
  };

  const handleCommanderClick = (product) => {
    if (!estDisponible(product)) {
      showFeedback(`${product.nom} n'est plus disponible`);
      return;
    }
    let current = [];
    try {
      current = JSON.parse(localStorage.getItem(cartKey) || '[]');
    } catch {
      current = [];
    }
    const exists = current.some((item) => String(item.id) === String(product.id));
    if (!exists) {
      const updated = [
        ...current,
        {
          id: product.id,
          nom: product.nom,
          prix: Number(product.prix) || 0,
          quantite: 1,
          image: product.media || product.image || fallbackImage,
          unite: product.unite || 'kg',
          adresse: product.adresse || 'Dakar',
        },
      ];
      saveCartToStorage(updated);
    }
    navigate('/acheteur/panier');
  };

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">
        <main className="no-scrollbar h-full overflow-y-auto pb-24">

          {/* HEADER HÉRITÉ */}
          <AcheteurHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterClick={() =>
              setSelectedCategory(selectedCategory === 'tous' ? 'poisson' : 'tous')
            }
            cartCount={cartCount}
            locationLabel="Dakar, Plateau"
          />

          {/* ZONES DE PÊCHE */}
          <section className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 pt-4">
            {locations.map(({ id, name, icon: Icon }) => {
              const active = selectedLocation === id;
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => setSelectedLocation(id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-[#0C3B4A] text-white'
                      : 'bg-white text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Icon size={13} className={active ? 'text-[#5FD9C4]' : 'text-stone-400'} />
                  {name}
                </button>
              );
            })}
          </section>

          {/* ONGLETS CATEGORIES */}
          <section className="flex items-center gap-5 border-b border-stone-200 px-4">
            {categories.map(({ id, name, icon: Icon }) => {
              const active = selectedCategory === id;
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => setSelectedCategory(id)}
                  className={`flex items-center gap-1.5 border-b-2 pb-2.5 pt-1 text-sm font-bold transition ${
                    active
                      ? 'border-[#FF6B4A] text-stone-900'
                      : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {Icon && <Icon size={14} />}
                  {name}
                </button>
              );
            })}
          </section>

          {/* GRILLE PRODUITS */}
          <section className="px-4 pt-4">
            {publications.chargement ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-[22px] bg-white shadow-sm shadow-black/5">
                    <div className="aspect-[4/5] w-full animate-pulse bg-stone-200" />
                    <div className="space-y-2 p-2.5">
                      <div className="h-3 w-3/4 animate-pulse rounded-full bg-stone-200" />
                      <div className="h-3 w-1/2 animate-pulse rounded-full bg-stone-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[28px] bg-[#0C3B4A]/5">
                  <Fish size={28} className="text-[#0C3B4A]/40" />
                </div>
                <p className="text-sm font-bold text-stone-700">Aucun produit trouvé</p>
                <p className="mt-1 text-xs text-stone-400">Modifiez votre recherche ou vos filtres.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => {
                  const sellerName = getSellerName(product);
                  const panierItem = panier.find((item) => String(item.id) === String(product.id));
                  const isInCart = !!panierItem;
                  const disponible = estDisponible(product);
                  const audioId = `prod-${product.id}`;
                  const isPlaying = audioEnCours === audioId;

                  return (
                    <div
                      key={product.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/acheteur/produit/${product.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/acheteur/produit/${product.id}`)}
                      className="group cursor-pointer overflow-hidden rounded-[22px] bg-white shadow-sm shadow-black/5 transition active:scale-[0.98]"
                    >
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-200">
                        <img
                          src={product.media || product.image || fallbackImage}
                          alt={product.nom}
                          className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
                            disponible ? '' : 'grayscale opacity-60'
                          }`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = fallbackImage;
                          }}
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />

                        {product.audio && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAudio(product);
                            }}
                            aria-label={isPlaying ? 'Pause' : 'Lecture de la note vocale'}
                            className={`absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition ${
                              isPlaying ? 'bg-[#FF6B4A] text-white' : 'bg-black/45 text-white hover:bg-black/60'
                            }`}
                          >
                            {isPlaying ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                          </button>
                        )}

                        {!disponible && (
                          <span className="absolute right-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-bold text-white">
                            Épuisé
                          </span>
                        )}

                        <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/50 bg-[#0C3B4A] text-[9px] font-bold text-white">
                            {product.pecheur?.photo ? (
                              <img src={product.pecheur.photo} alt="" className="h-full w-full object-cover" />
                            ) : (
                              getSellerInitial(sellerName)
                            )}
                          </div>
                          <span className="truncate text-[10px] font-semibold text-white/90">{sellerName}</span>
                          {product.pecheur?.est_premium && (
                            <BadgeCheck size={11} className="shrink-0 text-[#5FD9C4]" />
                          )}
                        </div>
                      </div>

                      <div className="p-2.5">
                        <h2 className="font-display truncate text-[13px] font-bold leading-tight text-stone-900">
                          {product.nom}
                        </h2>
                        <p className="mt-0.5 truncate text-[10px] font-medium text-stone-400">
                          {product.adresse || 'Dakar'}
                        </p>

                        <div className="mt-2 flex items-end justify-between gap-1">
                          <div className="min-w-0">
                            <p
                              className={`font-display truncate text-sm font-bold leading-none ${
                                disponible ? 'text-stone-900' : 'text-stone-400'
                              }`}
                            >
                              {formatPrice(product.prix)}
                            </p>
                            <p className="mt-0.5 text-[9px] font-medium text-stone-400">/ {product.unite || 'kg'}</p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCommanderClick(product);
                              }}
                              disabled={!disponible}
                              aria-label={`Commander ${product.nom} maintenant`}
                              className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                                disponible
                                  ? 'border-stone-200 text-stone-600 hover:border-[#0C3B4A] hover:text-[#0C3B4A]'
                                  : 'cursor-not-allowed border-stone-100 text-stone-300'
                              }`}
                            >
                              <ArrowUpRight size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlusClick(product);
                              }}
                              disabled={!disponible}
                              aria-label={disponible ? `Ajouter ${product.nom} au panier` : `${product.nom} indisponible`}
                              className={`flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition ${
                                !disponible
                                  ? 'cursor-not-allowed bg-stone-100 text-stone-300'
                                  : isInCart
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-[#FF6B4A] text-white hover:bg-[#E85A39]'
                              }`}
                            >
                              {isInCart ? <Check size={13} /> : <Plus size={13} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {/* NAVIGATION */}
        <AcheteurBottomNav />

        {/* TOAST */}
        {showToast && (
          <div className="lb-toast absolute left-1/2 top-4 z-50 flex max-w-[88%] -translate-x-1/2 items-center gap-2 rounded-2xl bg-[#0C3B4A] px-4 py-3 text-center text-xs font-semibold text-white shadow-2xl">
            <CheckCircle size={15} className="shrink-0 text-[#5FD9C4]" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}