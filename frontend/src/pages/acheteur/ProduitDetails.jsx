import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, MapPin, Clock, User, Phone, Fish,
  Plus, Minus, Check, AlertCircle, ShieldCheck,
} from 'lucide-react';
import { usePublications } from '../../context/PublicationContext';
import { useAuth } from '../../context/AuthContext';

const fallbackImage = '/images/fallback.png';

const formatPrice = (price) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(price) || 0)} FCFA`;

const getSellerName = (produit) => {
  const nestedName = `${produit?.pecheur?.prenom || ''} ${produit?.pecheur?.nom || ''}`.trim();
  if (nestedName) return nestedName;

  const flatName = `${produit?.pecheur_prenom || ''} ${produit?.pecheur_nom || ''}`.trim();
  if (flatName) return flatName;

  return 'Pêcheur Lebougui';
};

const getSellerInitial = (name) => (name ? name.charAt(0).toUpperCase() : 'P');

const getCategorieLabel = (categorie) => {
  if (categorie === 'poisson') return 'Poisson';
  if (categorie === 'fruit_de_mer') return 'Fruit de mer';
  return categorie || 'Produit';
};

const versLignePanier = (p, qte) => ({
  id: p.id,
  nom: p.nom,
  prix: Number(p.prix) || 0,
  quantite: qte,
  image: p.media || p.image || fallbackImage,
  unite: p.unite || 'kg',
  adresse: p.adresse || 'Dakar',
});

export default function ProduitDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { publications, chargerPublications } = usePublications();
  const { estAuthentifie, utilisateur } = useAuth();

  const [produit, setProduit] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [quantite, setQuantite] = useState(1);
  const [dansPanier, setDansPanier] = useState(false);

  const cartKey = utilisateur?.id
    ? `panier_acheteur_${utilisateur.id}`
    : 'panier_acheteur_guest';

  const lirePanier = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/connexion');
      return;
    }
    if (estAuthentifie()) {
      chargerPublications(true);
    }
  }, [navigate, estAuthentifie, chargerPublications]);

  useEffect(() => {
    if (publications.produits.length > 0) {
      const foundProduit = publications.produits.find((p) => p.id == id);
      if (foundProduit) setProduit(foundProduit);
      setChargement(false);
    }
  }, [id, publications.produits]);

  useEffect(() => {
    setDansPanier(lirePanier().some((item) => item.id == id));
  }, [id, cartKey]);

  // ============================================================
  // Reconstruction du pêcheur complet (objet OU ID OU champs plats)
  // ============================================================
  const pecheurComplet = useMemo(() => {
    if (!produit) return null;

    // Cas 1 : pecheur est déjà un objet complet
    if (produit.pecheur && typeof produit.pecheur === 'object') {
      return produit.pecheur;
    }

    const pecheurId = produit.pecheur?.id || produit.pecheur;

    // Cas 2 : pecheur est un ID → chercher dans les autres publications
    if (pecheurId) {
      const trouve = publications.produits.find((p) => {
        const pId = p.pecheur?.id || p.pecheur;
        return (
          String(pId) === String(pecheurId) &&
          p.pecheur &&
          typeof p.pecheur === 'object'
        );
      });
      if (trouve?.pecheur) return trouve.pecheur;
    }

    // Cas 3 : fallback via champs plats (pecheur_prenom, pecheur_nom...)
    if (
      produit.pecheur_prenom ||
      produit.pecheur_nom ||
      produit.pecheur_photo ||
      produit.telephone_pecheur
    ) {
      return {
        id: pecheurId,
        prenom: produit.pecheur_prenom || '',
        nom: produit.pecheur_nom || '',
        photo: produit.pecheur_photo || null,
        identifiant:
          produit.pecheur_identifiant || produit.telephone_pecheur || null,
        telephone: produit.telephone_pecheur || null,
        est_premium: produit.pecheur_est_premium || false,
        adresse: produit.adresse || 'Dakar',
      };
    }

    // Cas 4 : rien du tout mais on a au moins un ID
    if (pecheurId) {
      return { id: pecheurId };
    }

    return null;
  }, [produit, publications.produits]);

  const mettreAJourQuantite = (delta) => {
    setQuantite((prev) => {
      const next = prev + delta;
      return Math.max(1, Math.min(next, produit?.quantite || 100));
    });
  };

  const estDisponible = () =>
    produit?.statut === 'disponible' && (produit?.quantite || 0) > 0;

  const enregistrerDansPanier = ({ remplacer }) => {
    const panier = lirePanier();
    const stock = Number(produit.quantite) || 0;
    const existe = panier.some(
      (item) => String(item.id) === String(produit.id)
    );

    let maj;
    if (existe) {
      maj = panier.map((item) => {
        if (String(item.id) !== String(produit.id)) return item;
        const nouvelle = remplacer
          ? quantite
          : (Number(item.quantite) || 0) + quantite;
        return {
          ...item,
          quantite: stock > 0 ? Math.min(nouvelle, stock) : nouvelle,
        };
      });
    } else {
      maj = [...panier, versLignePanier(produit, quantite)];
    }

    try {
      localStorage.setItem(cartKey, JSON.stringify(maj));
    } catch (e) {
      console.error('Erreur écriture panier:', e);
    }
  };

  const ajouterAuPanier = () => {
    if (!produit || !estDisponible()) return;

    enregistrerDansPanier({ remplacer: false });
    setDansPanier(true);
    navigate('/acheteur/panier', {
      state: {
        produit: { ...produit, quantite },
        message: 'Produit ajouté au panier avec succès!',
      },
    });
  };

  const acheterMaintenant = () => {
    if (!produit || !estDisponible()) return;

    enregistrerDansPanier({ remplacer: true });
    navigate('/acheteur/panier');
  };

  const calculerSousTotal = () => (produit?.prix || 0) * quantite;

  // Autres produits du même pêcheur
  const pecheurId = produit?.pecheur?.id || produit?.pecheur;
  const autresProduits = produit
    ? publications.produits
        .filter((p) => {
          const pId = p.pecheur?.id || p.pecheur;
          return (
            pId &&
            pecheurId &&
            String(pId) === String(pecheurId) &&
            String(p.id) !== String(produit.id)
          );
        })
        .slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">
        {/* HEADER */}
        <header className="flex shrink-0 items-center justify-between px-4 pb-1 pt-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Retour"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-stone-800 shadow-sm transition hover:bg-white"
          >
            <ArrowLeft size={17} />
          </button>
          <h1 className="text-sm font-extrabold text-stone-900">
            Détails du produit
          </h1>
          <span className="h-10 w-10" />
        </header>

        <main className="no-scrollbar h-full overflow-y-auto px-4 pb-24 pt-3">
          {chargement ? (
            <div className="flex h-full min-h-[60vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-[#0C3B4A]" />
            </div>
          ) : !produit ? (
            <div className="py-16 text-center">
              <Fish size={38} className="mx-auto mb-3 text-stone-300" />
              <p className="text-sm font-semibold text-stone-700">
                Produit non trouvé
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Il n'existe plus ou n'est plus disponible.
              </p>
              <button
                type="button"
                onClick={() => navigate('/acheteur/accueil')}
                className="mt-5 rounded-2xl bg-[#0C3B4A] px-5 py-2.5 text-xs font-bold text-white shadow-md"
              >
                Retour au marché
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* IMAGE + BADGES */}
              <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-stone-200">
                <img
                  src={produit.media || produit.image || fallbackImage}
                  alt={produit.nom}
                  className={`h-full w-full object-cover ${
                    estDisponible() ? '' : 'grayscale opacity-60'
                  }`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackImage;
                  }}
                />
                <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                  <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                    {getCategorieLabel(produit.categorie)}
                  </span>
                  {pecheurComplet?.est_premium && (
                    <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                      <ShieldCheck size={11} /> Pêcheur Premium
                    </span>
                  )}
                </div>
                <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm ${
                      estDisponible() ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  >
                    {estDisponible() ? 'Disponible' : 'Indisponible'}
                  </span>
                  <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                    {produit.quantite || 0} kg en stock
                  </span>
                </div>
              </div>

              {/* TITRE */}
              <div>
                <h2 className="text-lg font-extrabold leading-snug text-stone-900">
                  {produit.nom}
                </h2>
                <p className="mt-2 text-xs font-medium leading-relaxed text-stone-500">
                  {produit.description ||
                    `Poisson frais pêché le ${new Date(
                      produit.date_publication
                    ).toLocaleDateString('fr-FR')}`}
                </p>
              </div>

              {/* PRIX */}
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  PRIX DIRECT
                </span>
                <p
                  className={`text-2xl font-black ${
                    estDisponible() ? 'text-stone-900' : 'text-stone-400'
                  }`}
                >
                  {formatPrice(produit.prix)}{' '}
                  <span className="text-xs font-medium text-stone-500">
                    / kg
                  </span>
                </p>
              </div>

              {/* AVERTISSEMENT INDISPONIBLE */}
              {!estDisponible() && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-rose-600"
                  />
                  <p className="text-xs font-medium leading-relaxed text-rose-700">
                    Ce produit n'est plus disponible. Le pêcheur l'a retiré de
                    la vente : il ne peut plus être ajouté au panier ni
                    commandé.
                  </p>
                </div>
              )}

              {/* QUANTITÉ */}
              <div
                className={`rounded-3xl border border-stone-100 bg-white p-3.5 shadow-sm ${
                  estDisponible() ? '' : 'opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">
                    Quantité
                  </span>
                  <span className="text-[11px] font-medium text-stone-400">
                    Max {produit.quantite || 0} kg
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => mettreAJourQuantite(-1)}
                    disabled={!estDisponible() || quantite <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-600 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-[64px] text-center text-base font-black text-stone-900">
                    {quantite} kg
                  </span>
                  <button
                    type="button"
                    onClick={() => mettreAJourQuantite(1)}
                    disabled={
                      !estDisponible() || quantite >= (produit.quantite || 100)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100/70 text-orange-700 transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="mt-3.5 flex items-center justify-between rounded-2xl bg-stone-50 px-3.5 py-2.5">
                  <span className="text-xs font-bold text-stone-500">
                    Sous-total
                  </span>
                  <span className="text-base font-black text-stone-900">
                    {formatPrice(calculerSousTotal())}
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={ajouterAuPanier}
                  disabled={!estDisponible()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] px-4 py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#E85A39] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {dansPanier && estDisponible() ? (
                    <Check size={15} />
                  ) : (
                    <ShoppingCart size={15} />
                  )}
                  {!estDisponible()
                    ? 'Indisponible'
                    : dansPanier
                    ? 'Mettre à jour le panier'
                    : 'Ajouter au panier'}
                </button>
                <button
                  type="button"
                  onClick={acheterMaintenant}
                  disabled={!estDisponible()}
                  className="shrink-0 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs font-bold text-stone-800 shadow-sm transition hover:bg-stone-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Acheter
                </button>
              </div>

              {/* PÊCHEUR */}
              <div className="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  Vendu par
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0C3B4A] text-sm font-bold text-white">
                    {pecheurComplet?.photo ? (
                      <img
                        src={pecheurComplet.photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getSellerInitial(getSellerName(produit))
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-stone-900">
                      {getSellerName(produit)}
                    </p>
                    {pecheurComplet?.est_premium ? (
                      <span className="text-[10px] font-bold text-emerald-600">
                        Pêcheur vérifié
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-stone-400">
                        Pêcheur professionnel
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/pecheur/${pecheurComplet?.id || produit.pecheur}`
                      )
                    }
                    className="shrink-0 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
                  >
                    Voir le profil
                  </button>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-stone-50 p-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#0C3B4A] shadow-sm">
                      <Phone size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                        Téléphone
                      </p>
                      <p className="truncate text-[11px] font-bold text-stone-800">
                        {pecheurComplet?.telephone ||
                          'Non disponible'}
                          
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-stone-50 p-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#0C3B4A] shadow-sm">
                      <MapPin size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                        Zone de pêche
                      </p>
                      <p className="truncate text-[11px] font-bold text-stone-800">
                        {pecheurComplet?.adresse || produit.adresse || 'Dakar'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-stone-50 p-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#0C3B4A] shadow-sm">
                      <Fish size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                        Spécialité
                      </p>
                      <p className="truncate text-[11px] font-bold text-stone-800">
                        {getCategorieLabel(produit.categorie)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-stone-50 p-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#0C3B4A] shadow-sm">
                      <Clock size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                        Publié
                      </p>
                      <p className="truncate text-[11px] font-bold text-stone-800">
                        {new Date(produit.date_publication).toLocaleDateString(
                          'fr-FR',
                          { day: 'numeric', month: 'short' }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AUTRES PRODUITS DU PÊCHEUR */}
              {autresProduits.length > 0 && (
                <div>
                  <h3 className="mb-2.5 text-sm font-extrabold text-stone-900">
                    Autres produits de{' '}
                    {pecheurComplet?.prenom ||
                      produit.pecheur?.prenom ||
                      'ce pêcheur'}
                  </h3>
                  <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                    {autresProduits.map((autre) => {
                      const autreDispo =
                        autre.statut === 'disponible' &&
                        (autre.quantite || 0) > 0;
                      return (
                        <button
                          type="button"
                          key={autre.id}
                          onClick={() => {
                            navigate(`/acheteur/produit/${autre.id}`);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-32 shrink-0 overflow-hidden rounded-2xl border border-stone-100 bg-white text-left shadow-sm transition active:scale-95"
                        >
                          <div className="h-24 w-full bg-stone-200">
                            <img
                              src={
                                autre.media || autre.image || fallbackImage
                              }
                              alt={autre.nom}
                              className={`h-full w-full object-cover ${
                                autreDispo ? '' : 'grayscale opacity-60'
                              }`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = fallbackImage;
                              }}
                            />
                          </div>
                          <div className="space-y-0.5 p-2.5">
                            <p className="truncate text-xs font-bold text-stone-900">
                              {autre.nom}
                            </p>
                            <p className="text-xs font-black text-stone-900">
                              {formatPrice(autre.prix)}
                            </p>
                            <p
                              className={`text-[10px] font-medium ${
                                autreDispo
                                  ? 'text-stone-400'
                                  : 'text-rose-500'
                              }`}
                            >
                              {autreDispo
                                ? `${autre.quantite || 0} kg dispo`
                                : 'Indisponible'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}