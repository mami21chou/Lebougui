import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Check,
  CheckCircle,
  Crown,
  Fish,
  LayoutGrid,
  MapPin,
  Pause,
  Play,
  Plus,
  ShoppingBag,
  Waves,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { usePublications } from '../../context/PublicationContext';
import { useAudio } from '../../context/AudioContext';
import AcheteurHeader from '../../components/AcheteurHeader';
import AcheteurBottomNav from '../../components/AcheteurBottomNav';


// ============================================================
// DONNÉES
// ============================================================

const locations = [
  { id: 'tous', name: 'Toute la côte', icon: MapPin },
  { id: 'soumbedioune', name: 'Soumbédioune', icon: MapPin },
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


// ============================================================
// UTILITAIRES
// ============================================================

const formatPrice = (price) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(price) || 0)} FCFA`;

const estDisponible = (product) =>
  (product.statut ?? 'disponible') === 'disponible';

const getSellerName = (product) => {
  const nestedName =
    `${product.pecheur?.prenom || ''} ${product.pecheur?.nom || ''}`.trim();

  return (
    nestedName ||
    `${product.pecheur_prenom || ''} ${product.pecheur_nom || ''}`.trim() ||
    'Pêcheur Lebougui'
  );
};

const getSellerInitial = (name) =>
  name.charAt(0).toUpperCase();


// ============================================================
// DASHBOARD
// ============================================================

export default function AcheteurDashboard() {
  const navigate = useNavigate();

  const { utilisateur } = useAuth();

  const {
    publications,
    chargerPublications,
  } = usePublications();

  const {
    currentId: audioEnCours,
    play: playAudio,
    pause: pauseAudio,
  } = useAudio();


  // ==========================================================
  // ÉTATS
  // ==========================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('tous');
  const [selectedCategory, setSelectedCategory] = useState('tous');

  const [panier, setPanier] = useState([]);

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);


  // ==========================================================
  // PANIER
  // ==========================================================

  const cartKey = utilisateur?.id
    ? `panier_acheteur_${utilisateur.id}`
    : 'panier_acheteur_guest';


  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/connexion');
      return;
    }

    chargerPublications(true);
  }, [chargerPublications, navigate]);


  // ==========================================================
  // RÉCUPÉRATION DU PANIER
  // ==========================================================

  useEffect(() => {
    if (!cartKey) return;

    try {
      const saved = JSON.parse(
        localStorage.getItem(cartKey) || '[]'
      );

      setPanier(
        Array.isArray(saved) ? saved : []
      );
    } catch {
      setPanier([]);
    }
  }, [cartKey]);


  // ==========================================================
  // TOAST
  // ==========================================================

  const showFeedback = (message) => {
    setToastMessage(message);
    setShowToast(true);

    window.setTimeout(
      () => setShowToast(false),
      2000
    );
  };


  // ==========================================================
  // SAUVEGARDE PANIER
  // ==========================================================

  const saveCartToStorage = (updatedCart) => {
    setPanier(updatedCart);

    try {
      localStorage.setItem(
        cartKey,
        JSON.stringify(updatedCart)
      );

      window.dispatchEvent(
        new Event('cart:update')
      );
    } catch (e) {
      console.error(
        'Erreur sauvegarde panier:',
        e
      );
    }
  };


  // ==========================================================
  // AUDIO
  // ==========================================================

  const toggleAudio = (product) => {
    if (!product.audio) {
      showFeedback(
        'Aucune note vocale disponible pour ce produit'
      );
      return;
    }

    const id = `prod-${product.id}`;

    if (audioEnCours === id) {
      pauseAudio();
    } else {
      playAudio(
        id,
        product.audio
      );
    }
  };


  // ==========================================================
  // FILTRES
  // ==========================================================

  const filteredProducts = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return (publications.produits || []).filter(
      (product) => {
        const searchable =
          `${product.nom || ''} ${product.categorie || ''} ${product.adresse || ''} ${product.description || ''}`
            .toLowerCase();

        const matchesQuery =
          !query ||
          searchable.includes(query);

        const matchesLocation =
          selectedLocation === 'tous' ||
          product.adresse
            ?.toLowerCase()
            .includes(selectedLocation);

        const matchesCategory =
          selectedCategory === 'tous' ||
          product.categorie === selectedCategory;

        return (
          matchesQuery &&
          matchesLocation &&
          matchesCategory
        );
      }
    );
  }, [
    publications.produits,
    searchQuery,
    selectedCategory,
    selectedLocation,
  ]);


  // ==========================================================
  // COMPTEUR PANIER
  // ==========================================================

  const cartCount = panier.reduce(
    (t, i) =>
      t + Number(i.quantite || 0),
    0
  );


  // ==========================================================
  // AJOUT PANIER
  // ==========================================================

  const handlePlusClick = (product) => {
    if (!estDisponible(product)) {
      showFeedback(
        `${product.nom} n'est plus disponible`
      );
      return;
    }

    let current = [];

    try {
      current = JSON.parse(
        localStorage.getItem(cartKey) || '[]'
      );
    } catch {
      current = [];
    }

    const exists = current.some(
      (item) =>
        String(item.id) === String(product.id)
    );

    if (exists) {
      showFeedback(
        'Ce produit est déjà dans le panier'
      );
      return;
    }

    const updated = [
      ...current,
      {
        id: product.id,
        nom: product.nom,
        prix: Number(product.prix) || 0,
        quantite: 1,
        image:
          product.media ||
          product.image ||
          fallbackImage,
        unite:
          product.unite || 'kg',
        adresse:
          product.adresse || 'Dakar',
      },
    ];

    saveCartToStorage(updated);

    showFeedback(
      `${product.nom} ajouté au panier`
    );
  };


  // ==========================================================
  // COMMANDER
  // ==========================================================

  const handleCommanderClick = (product) => {
    if (!estDisponible(product)) {
      showFeedback(
        `${product.nom} n'est plus disponible`
      );
      return;
    }

    let current = [];

    try {
      current = JSON.parse(
        localStorage.getItem(cartKey) || '[]'
      );
    } catch {
      current = [];
    }

    const exists = current.some(
      (item) =>
        String(item.id) === String(product.id)
    );

    if (!exists) {
      const updated = [
        ...current,
        {
          id: product.id,
          nom: product.nom,
          prix: Number(product.prix) || 0,
          quantite: 1,
          image:
            product.media ||
            product.image ||
            fallbackImage,
          unite:
            product.unite || 'kg',
          adresse:
            product.adresse || 'Dakar',
        },
      ];

      saveCartToStorage(updated);
    }

    navigate('/acheteur/panier');
  };


  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div
      className="
        min-h-screen
        bg-stone-300
        font-sans
        antialiased

        sm:flex
        sm:items-center
        sm:justify-center
        sm:py-6

        lg:block
        lg:bg-[#F1ECE5]
        lg:py-0
      "
    >



      <div
        className="
          relative
          flex
          h-screen
          w-full
          max-w-md
          flex-col
          overflow-hidden
          bg-[#FAF6F0]

          sm:h-[880px]
          sm:max-h-[92vh]
          sm:rounded-[40px]
          sm:border-8
          sm:border-stone-300
          sm:shadow-2xl

          lg:max-w-none
          lg:rounded-none
          lg:border-0
          lg:shadow-none
        "
      >

        {/* ====================================================
            SIDEBAR DESKTOP
            INTÉGRÉ À LA PAGE
        ==================================================== */}

        <aside
          className="
            fixed
            inset-y-0
            left-0
            z-40
            hidden
            w-[245px]
            flex-col
            border-r
            border-white/50
            bg-[#0C3B4A]/95
            shadow-[8px_0_30px_rgba(12,59,74,0.08)]
            backdrop-blur-2xl

            lg:flex
          "
        >

          {/* ==================================================
              ZONE LOGO
          ================================================== */}

          <div
            className="
              flex
              h-[90px]
              shrink-0
              items-center
              border-b
              border-white/10
              px-7
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >


              <div>
                <p
                  className="
                    text-lg
                    font-bold
                    tracking-tight
                    text-white
                  "
                >
                  Lebougui
                </p>

                <p
                  className="
                    text-[9px]
                    font-medium
                    text-white/40
                  "
                >
                  Gaal gui teer na
                </p>
              </div>

            </div>

          </div>


          {/* ==================================================
              NAVIGATION PRINCIPALE

              EXACTEMENT LES 4 ÉLÉMENTS DU BOTTOM NAV
          ================================================== */}

          <nav
            className="
              flex-1
              px-4
              py-7
            "
          >

            <p
              className="
                mb-4
                px-3
                text-[9px]
                font-bold
                uppercase
                tracking-[0.18em]
                text-white/30
              "
            >
              Menu
            </p>


            {/* =================================================
                MARCHÉ
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                navigate('/acheteur')
              }
              className="
                group
                mb-2
                flex
                w-full
                items-center
                gap-3
                rounded-2xl
                border
                border-white/10
                bg-white/10
                px-3
                py-3
                text-left
                backdrop-blur-xl
                transition
                duration-200
                hover:bg-white/15
              "
            >

              <span
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#FF6B4A]
                  text-white
                  shadow-lg
                  shadow-[#FF6B4A]/20
                "
              >
                <LayoutGrid size={18} />
              </span>

              <div className="flex-1">
                <p
                  className="
                    text-sm
                    font-bold
                    text-white
                  "
                >
                  Marché
                </p>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    text-white/35
                  "
                >
                  Découvrir les produits
                </p>
              </div>

            </button>


            {/* =================================================
                COMMANDES
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                navigate('/acheteur/commandes')
              }
              className="
                group
                mb-2
                flex
                w-full
                items-center
                gap-3
                rounded-2xl
                border
                border-transparent
                px-3
                py-3
                text-left
                transition
                duration-200
                hover:border-white/5
                hover:bg-white/10
              "
            >

              <span
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/10
                  text-white/60
                  transition
                  group-hover:bg-white/15
                  group-hover:text-white
                "
              >
                <ShoppingBag size={18} />
              </span>

              <div className="flex-1">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-white/70
                    transition
                    group-hover:text-white
                  "
                >
                  Commandes
                </p>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    text-white/30
                  "
                >
                  Suivre mes commandes
                </p>
              </div>

            </button>


            {/* =================================================
                ALERTES
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                navigate('/acheteur/alertes')
              }
              className="
                group
                mb-2
                flex
                w-full
                items-center
                gap-3
                rounded-2xl
                border
                border-transparent
                px-3
                py-3
                text-left
                transition
                duration-200
                hover:border-white/5
                hover:bg-white/10
              "
            >

              <span
                className="
                  relative
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/10
                  text-white/60
                  transition
                  group-hover:bg-white/15
                  group-hover:text-white
                "
              >

                <Bell size={18} />

                {/* Badge notification */}
                <span
                  
                />

              </span>

              <div className="flex-1">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-white/70
                    transition
                    group-hover:text-white
                  "
                >
                  Alertes
                </p>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    text-white/30
                  "
                >
                  Notifications et nouveautés
                </p>
              </div>

            </button>


            {/* =================================================
                PREMIUM
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                navigate('/acheteur/premium')
              }
              className="
                group
                flex
                w-full
                items-center
                gap-3
                rounded-2xl
                border
                border-transparent
                px-3
                py-3
                text-left
                transition
                duration-200
                hover:border-white/5
                hover:bg-white/10
              "
            >

              <span
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#FF6B4A]/10
                  text-[#FF6B4A]
                  ring-1
                  ring-[#FF6B4A]/10
                  transition
                  group-hover:bg-[#FF6B4A]/20
                "
              >
                <Crown size={18} />
              </span>

              <div className="flex-1">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-white/70
                    transition
                    group-hover:text-white
                  "
                >
                  Premium
                </p>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    text-white/30
                  "
                >
                  Profiter des avantages
                </p>
              </div>

            </button>

          </nav>


          {/* ==================================================
              PROFIL EN BAS
          ================================================== */}

          <div
            className="
              shrink-0
              border-t
              border-white/10
              p-4
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                rounded-2xl
                border
                border-white/10
                bg-white/5
                p-3
                backdrop-blur-xl
              "
            >

              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#5FD9C4]/15
                  text-xs
                  font-bold
                  text-[#5FD9C4]
                  ring-1
                  ring-[#5FD9C4]/20
                "
              >
                {utilisateur?.prenom?.charAt(0) ||
                  utilisateur?.nom?.charAt(0) ||
                  'A'}
              </div>

              <div className="min-w-0">

                <p
                  className="
                    truncate
                    text-xs
                    font-bold
                    text-white
                  "
                >
                  {utilisateur?.prenom ||
                    'Acheteur'}
                </p>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    text-white/35
                  "
                >
                  Acheteur
                </p>

              </div>

            </div>

          </div>

        </aside>


        {/* ====================================================
            CONTENU PRINCIPAL
        ==================================================== */}

        <main
          className="
            no-scrollbar
            h-full
            overflow-y-auto
            pb-24

            lg:pb-8
            lg:pl-[245px]
          "
        >

          {/* ==================================================
              HEADER
          ================================================== */}

          <div
            className="
              lg:mx-auto
              lg:max-w-[1500px]
              lg:px-8
            "
          >

            <AcheteurHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFilterClick={() =>
                setSelectedCategory(
                  selectedCategory === 'tous'
                    ? 'poisson'
                    : 'tous'
                )
              }
              cartCount={cartCount}
              locationLabel="Dakar, Plateau"
            />

          </div>


          {/* ==================================================
              ZONES DE PÊCHE
          ================================================== */}

          <section
            className="
              no-scrollbar
              flex
              gap-2
              overflow-x-auto
              px-4
              pb-3
              pt-4

              lg:mx-auto
              lg:max-w-[1500px]
              lg:px-8
              lg:pt-5
            "
          >

            {locations.map(
              ({
                id,
                name,
                icon: Icon,
              }) => {

                const active =
                  selectedLocation === id;

                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() =>
                      setSelectedLocation(id)
                    }
                    className={`
                      flex
                      shrink-0
                      items-center
                      gap-1.5
                      rounded-full
                      px-3.5
                      py-1.5
                      text-xs
                      font-semibold
                      transition

                      ${
                        active
                          ? 'bg-[#0C3B4A] text-white'
                          : 'bg-white text-stone-500 hover:text-stone-800'
                      }
                    `}
                  >

                    <Icon
                      size={13}
                      className={
                        active
                          ? 'text-[#5FD9C4]'
                          : 'text-stone-400'
                      }
                    />

                    {name}

                  </button>
                );
              }
            )}

          </section>


          {/* ==================================================
              CATÉGORIES
          ================================================== */}

          <section
            className="
              flex
              items-center
              gap-5
              border-b
              border-stone-200
              px-4

              lg:mx-auto
              lg:max-w-[1500px]
              lg:px-8
            "
          >

            {categories.map(
              ({
                id,
                name,
                icon: Icon,
              }) => {

                const active =
                  selectedCategory === id;

                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() =>
                      setSelectedCategory(id)
                    }
                    className={`
                      flex
                      items-center
                      gap-1.5
                      border-b-2
                      pb-2.5
                      pt-1
                      text-sm
                      font-bold
                      transition

                      ${
                        active
                          ? 'border-[#FF6B4A] text-stone-900'
                          : 'border-transparent text-stone-400 hover:text-stone-600'
                      }
                    `}
                  >

                    {Icon && (
                      <Icon size={14} />
                    )}

                    {name}

                  </button>
                );
              }
            )}

          </section>


          {/* ==================================================
              GRILLE PRODUITS
          ================================================== */}

          <section
            className="
              px-4
              pt-4

              lg:mx-auto
              lg:max-w-[1500px]
              lg:px-8
              lg:pt-6
            "
          >

            {publications.chargement ? (

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3

                  lg:grid-cols-4
                  lg:gap-5

                  xl:grid-cols-5
                  2xl:grid-cols-6
                "
              >

                {Array.from({
                  length: 4,
                }).map((_, i) => (

                  <div
                    key={i}
                    className="
                      overflow-hidden
                      rounded-[22px]
                      bg-white
                      shadow-sm
                      shadow-black/5
                    "
                  >

                    <div
                      className="
                        aspect-[4/5]
                        w-full
                        animate-pulse
                        bg-stone-200
                      "
                    />

                    <div className="space-y-2 p-2.5">

                      <div
                        className="
                          h-3
                          w-3/4
                          animate-pulse
                          rounded-full
                          bg-stone-200
                        "
                      />

                      <div
                        className="
                          h-3
                          w-1/2
                          animate-pulse
                          rounded-full
                          bg-stone-200
                        "
                      />

                    </div>

                  </div>

                ))}

              </div>

            ) : filteredProducts.length === 0 ? (

              <div
                className="
                  py-16
                  text-center
                "
              >

                <div
                  className="
                    mx-auto
                    mb-3
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-[28px]
                    bg-[#0C3B4A]/5
                  "
                >
                  <Fish
                    size={28}
                    className="text-[#0C3B4A]/40"
                  />
                </div>

                <p
                  className="
                    text-sm
                    font-bold
                    text-stone-700
                  "
                >
                  Aucun produit trouvé
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-stone-400
                  "
                >
                  Modifiez votre recherche ou vos filtres.
                </p>

              </div>

            ) : (

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3

                  lg:grid-cols-4
                  lg:gap-5

                  xl:grid-cols-5
                  2xl:grid-cols-6
                "
              >

                {filteredProducts.map(
                  (product) => {

                    const sellerName =
                      getSellerName(product);

                    const panierItem =
                      panier.find(
                        (item) =>
                          String(item.id) ===
                          String(product.id)
                      );

                    const isInCart =
                      !!panierItem;

                    const disponible =
                      estDisponible(product);

                    const audioId =
                      `prod-${product.id}`;

                    const isPlaying =
                      audioEnCours === audioId;


                    return (

                      <div
                        key={product.id}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          navigate(
                            `/acheteur/produit/${product.id}`
                          )
                        }
                        onKeyDown={(e) =>
                          e.key === 'Enter' &&
                          navigate(
                            `/acheteur/produit/${product.id}`
                          )
                        }
                        className="
                          group
                          cursor-pointer
                          overflow-hidden
                          rounded-[22px]
                          bg-white
                          shadow-sm
                          shadow-black/5
                          transition
                          active:scale-[0.98]
                          lg:hover:-translate-y-1
                          lg:hover:shadow-lg
                        "
                      >

                        <div
                          className="
                            relative
                            aspect-[4/5]
                            w-full
                            overflow-hidden
                            bg-stone-200
                          "
                        >

                          <img
                            src={
                              product.media ||
                              product.image ||
                              fallbackImage
                            }
                            alt={product.nom}
                            className={`
                              h-full
                              w-full
                              object-cover
                              transition
                              duration-300
                              group-hover:scale-105

                              ${
                                disponible
                                  ? ''
                                  : 'grayscale opacity-60'
                              }
                            `}
                            onError={(e) => {
                              e.target.onerror =
                                null;

                              e.target.src =
                                fallbackImage;
                            }}
                          />

                          <div
                            className="
                              pointer-events-none
                              absolute
                              inset-x-0
                              bottom-0
                              h-16
                              bg-gradient-to-t
                              from-black/55
                              to-transparent
                            "
                          />

                          {product.audio && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAudio(product);
                              }}
                              aria-label={
                                isPlaying
                                  ? 'Pause'
                                  : 'Lecture de la note vocale'
                              }
                              className={`
                                absolute
                                left-2
                                top-2
                                flex
                                h-7
                                w-7
                                items-center
                                justify-center
                                rounded-full
                                backdrop-blur-sm
                                transition

                                ${
                                  isPlaying
                                    ? 'bg-[#FF6B4A] text-white'
                                    : 'bg-black/45 text-white hover:bg-black/60'
                                }
                              `}
                            >
                              {isPlaying ? (
                                <Pause
                                  size={11}
                                  fill="currentColor"
                                />
                              ) : (
                                <Play
                                  size={11}
                                  fill="currentColor"
                                />
                              )}
                            </button>
                          )}

                          {!disponible && (
                            <span
                              className="
                                absolute
                                right-2
                                top-2
                                rounded-full
                                bg-rose-600
                                px-2
                                py-0.5
                                text-[9px]
                                font-bold
                                text-white
                              "
                            >
                              Épuisé
                            </span>
                          )}

                          <div
                            className="
                              absolute
                              inset-x-2
                              bottom-2
                              flex
                              items-center
                              gap-1.5
                            "
                          >

                            <div
                              className="
                                flex
                                h-5
                                w-5
                                shrink-0
                                items-center
                                justify-center
                                overflow-hidden
                                rounded-full
                                border
                                border-white/50
                                bg-[#0C3B4A]
                                text-[9px]
                                font-bold
                                text-white
                              "
                            >

                              {product.pecheur?.photo ? (
                                <img
                                  src={
                                    product.pecheur.photo
                                  }
                                  alt=""
                                  className="
                                    h-full
                                    w-full
                                    object-cover
                                  "
                                />
                              ) : (
                                getSellerInitial(
                                  sellerName
                                )
                              )}

                            </div>

                            <span
                              className="
                                truncate
                                text-[10px]
                                font-semibold
                                text-white/90
                              "
                            >
                              {sellerName}
                            </span>

                            {product.pecheur
                              ?.est_premium && (
                              <BadgeCheck
                                size={11}
                                className="
                                  shrink-0
                                  text-[#5FD9C4]
                                "
                              />
                            )}

                          </div>

                        </div>


                        <div className="p-2.5">

                          <h2
                            className="
                              font-display
                              truncate
                              text-[13px]
                              font-bold
                              leading-tight
                              text-stone-900
                            "
                          >
                            {product.nom}
                          </h2>

                          <p
                            className="
                              mt-0.5
                              truncate
                              text-[10px]
                              font-medium
                              text-stone-400
                            "
                          >
                            {product.adresse || 'Dakar'}
                          </p>


                          <div
                            className="
                              mt-2
                              flex
                              items-end
                              justify-between
                              gap-1
                            "
                          >

                            <div className="min-w-0">

                              <p
                                className={`
                                  font-display
                                  truncate
                                  text-sm
                                  font-bold
                                  leading-none

                                  ${
                                    disponible
                                      ? 'text-stone-900'
                                      : 'text-stone-400'
                                  }
                                `}
                              >
                                {formatPrice(
                                  product.prix
                                )}
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  text-[9px]
                                  font-medium
                                  text-stone-400
                                "
                              >
                                / {product.unite || 'kg'}
                              </p>

                            </div>


                            <div
                              className="
                                flex
                                shrink-0
                                items-center
                                gap-1
                              "
                            >

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCommanderClick(
                                    product
                                  );
                                }}
                                disabled={!disponible}
                                aria-label={
                                  `Commander ${product.nom} maintenant`
                                }
                                className={`
                                  flex
                                  h-7
                                  w-7
                                  items-center
                                  justify-center
                                  rounded-full
                                  border
                                  transition

                                  ${
                                    disponible
                                      ? 'border-stone-200 text-stone-600 hover:border-[#0C3B4A] hover:text-[#0C3B4A]'
                                      : 'cursor-not-allowed border-stone-100 text-stone-300'
                                  }
                                `}
                              >
                                <ArrowUpRight
                                  size={13}
                                />
                              </button>


                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlusClick(
                                    product
                                  );
                                }}
                                disabled={!disponible}
                                aria-label={
                                  disponible
                                    ? `Ajouter ${product.nom} au panier`
                                    : `${product.nom} indisponible`
                                }
                                className={`
                                  flex
                                  h-7
                                  w-7
                                  items-center
                                  justify-center
                                  rounded-full
                                  shadow-sm
                                  transition

                                  ${
                                    !disponible
                                      ? 'cursor-not-allowed bg-stone-100 text-stone-300'
                                      : isInCart
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-[#FF6B4A] text-white hover:bg-[#E85A39]'
                                  }
                                `}
                              >
                                {isInCart ? (
                                  <Check size={13} />
                                ) : (
                                  <Plus size={13} />
                                )}
                              </button>

                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>

        </main>


        {/* ====================================================
            BOTTOM NAV MOBILE
            100% CONSERVÉ
        ==================================================== */}

        <div className="lg:hidden">
          <AcheteurBottomNav />
        </div>


        {/* ====================================================
            TOAST
        ==================================================== */}

        {showToast && (
          <div
            className="
              lb-toast
              absolute
              left-1/2
              top-4
              z-[100]
              flex
              max-w-[88%]
              -translate-x-1/2
              items-center
              gap-2
              rounded-2xl
              bg-[#0C3B4A]
              px-4
              py-3
              text-center
              text-xs
              font-semibold
              text-white
              shadow-2xl

              lg:fixed
            "
          >

            <CheckCircle
              size={15}
              className="
                shrink-0
                text-[#5FD9C4]
              "
            />

            <span>
              {toastMessage}
            </span>

          </div>
        )}

      </div>
    </div>
  );
}

