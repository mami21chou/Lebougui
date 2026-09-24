import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Package, Check, Bike,
  ChevronRight, Home,
} from 'lucide-react';
import API from '../../services/api';
import { CommandeService } from '../../services/commandeService';
import LivreurBottomNav from '../../components/LivreurBottomNav';
import CarteInteractive from '../../components/CarteInteractive';

// ============================================================
// MAPPING ÉTAPES ↔ STATUT BACKEND
// ============================================================
const ETAPES = {
  en_attente: {
    etapeVisuelle: 1,
    titre: 'Récupération au quai',
    sousTitre: 'Contrôle qualité et chargement de la caisse',
    labelBouton: 'Caisse chargée · Départ en livraison',
    icon: Package,
    prochainStatut: 'recuperer',
    couleur: '#FF6B4A',
  },
  acceptee: {
    etapeVisuelle: 1,
    titre: 'Récupération au quai',
    sousTitre: 'Contrôle qualité et chargement de la caisse',
    labelBouton: 'Caisse chargée · Départ en livraison',
    icon: Package,
    prochainStatut: 'recuperer',
    couleur: '#FF6B4A',
  },
  en_recuperation: {
    etapeVisuelle: 1,
    titre: 'Récupération au quai',
    sousTitre: 'Contrôle qualité et chargement de la caisse',
    labelBouton: 'Caisse chargée · Départ en livraison',
    icon: Package,
    prochainStatut: 'recuperer',
    couleur: '#FF6B4A',
  },
  recuperee: {
    etapeVisuelle: 2,
    titre: 'En route vers le client',
    sousTitre: "La caisse est chargée, cap sur l'adresse de livraison",
    labelBouton: 'Arrivé chez le client · Confirmer la remise',
    icon: Bike,
    prochainStatut: 'terminer',
    couleur: '#0A8A5F',
  },
  en_livraison: {
    etapeVisuelle: 2,
    titre: 'En route vers le client',
    sousTitre: "La caisse est chargée, cap sur l'adresse de livraison",
    labelBouton: 'Arrivé chez le client · Confirmer la remise',
    icon: Bike,
    prochainStatut: 'terminer',
    couleur: '#0A8A5F',
  },
  livree: {
    etapeVisuelle: 3,
    titre: 'Livraison terminée',
    sousTitre: 'Le client a bien reçu sa commande',
    labelBouton: null,
    icon: Check,
    prochainStatut: null,
    couleur: '#0A8A5F',
  },
};

const ETAPES_VISUELLES = [
  { numero: 1, label: 'Récupération', icon: Package },
  { numero: 2, label: 'Trajet', icon: Bike },
  { numero: 3, label: 'Remise', icon: Home },
];

export default function LivraisonEnCours() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [livraison, setLivraison] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  // Coordonnées géographiques
  const [positionLivreur, setPositionLivreur] = useState(null);
  const [positionPecheur, setPositionPecheur] = useState(null);
  const [positionClient, setPositionClient] = useState(null);
  const [itineraire, setItineraire] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // GÉOLOCALISATION temps réel du livreur
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!navigator.geolocation) return;

    const onSuccess = (pos) => {
      setPositionLivreur({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    };

    navigator.geolocation.getCurrentPosition(onSuccess, () => {}, {
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const watch = navigator.geolocation.watchPosition(onSuccess, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });

    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // CHARGEMENT livraison — LECTURE pure (GET)
  // ═══════════════════════════════════════════════════════════
  const chargerLivraison = useCallback(async () => {
    try {
      let liv = null;

      try {
        const res = await API.get(`/livraisons/${id}/`);
        liv = res.data;
      } catch {
        const res = await API.get('/livraisons/en-cours/');
        liv = res.data?.en_cours || null;
      }

      setLivraison(liv);

      // Extraire les coordonnées
      const c = liv?.commandes_detail?.[0];
      if (c) {
        // Position pêcheur
        const latP = c.lignes?.[0]?.produit_detail?.latitude;
        const lngP = c.lignes?.[0]?.produit_detail?.longitude;
        if (latP && lngP) {
          setPositionPecheur({ lat: Number(latP), lng: Number(lngP) });
        } else if (c.lignes?.[0]?.produit_detail?.adresse) {
          // Fallback : géocodage nominatim (optionnel)
          geocoderAdresse(c.lignes[0].produit_detail.adresse).then((coords) => {
            if (coords) setPositionPecheur(coords);
          });
        }

        // Position client
        if (c.latitude_livraison && c.longitude_livraison) {
          setPositionClient({
            lat: Number(c.latitude_livraison),
            lng: Number(c.longitude_livraison),
          });
        } else if (c.adresse_livraison) {
          geocoderAdresse(c.adresse_livraison).then((coords) => {
            if (coords) setPositionClient(coords);
          });
        }
      }
    } catch (err) {
      console.error('Erreur chargement livraison:', err);
    } finally {
      setChargement(false);
    }
  }, [id]);

  useEffect(() => {
    chargerLivraison();
    const onFocus = () => chargerLivraison();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [chargerLivraison]);

  // ═══════════════════════════════════════════════════════════
  // ACTION UNIFIÉE
  // ═══════════════════════════════════════════════════════════
  const handleActionPrincipale = async () => {
    if (!livraison || actionEnCours) return;
    const etape = ETAPES[livraison.statut];
    if (!etape?.prochainStatut) return;

    setActionEnCours(true);
    setErreur('');

    try {
      let updated = null;

      if (etape.prochainStatut === 'recuperer') {
        updated = await CommandeService.recupererLivraison(livraison.id);
      } else if (etape.prochainStatut === 'terminer') {
        updated = await CommandeService.terminerLivraison(livraison.id);
      }

      if (updated?.statut) {
        setLivraison(updated);
      } else {
        await chargerLivraison();
      }

      if (etape.prochainStatut === 'terminer') {
        setTimeout(() => {
          navigate('/livreur/livraison-terminee');
        }, 1200);
      }
    } catch (err) {
      const msg =
        err.response?.data?.erreur ||
        err.response?.data?.detail ||
        'Impossible de mettre à jour la livraison.';
      setErreur(msg);
      await chargerLivraison();
    } finally {
      setActionEnCours(false);
    }
  };

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B4A] border-t-transparent" />
      </div>
    );
  }

  if (!livraison) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF6F0] p-6">
        <Package size={48} className="mb-4 text-stone-300" />
        <p className="mb-4 text-sm font-bold text-stone-700">
          Aucune livraison en cours.
        </p>
        <button
          onClick={() => navigate('/livreur/accueil')}
          className="rounded-xl bg-[#0C3B4A] px-5 py-2.5 text-xs font-bold text-white"
        >
          Retour
        </button>
      </div>
    );
  }

  const etape = ETAPES[livraison.statut] || ETAPES.acceptee;
  const Icone = etape.icon;
  const commandes = livraison.commandes_detail || [];
  const premiereCommande = commandes[0] || {};

  const estEtape1 = etape.etapeVisuelle === 1;

  const nomDestination = estEtape1
    ? premiereCommande.nom_pecheur || 'Pêcheur'
    : `${premiereCommande.acheteur_detail?.prenom || ''} ${
        premiereCommande.acheteur_detail?.nom || ''
      }`.trim() || 'Client';

  const adresseDestination = estEtape1
    ? premiereCommande.lignes?.[0]?.produit_detail?.adresse || 'Quai de pêche'
    : premiereCommande.adresse_livraison || 'Adresse client';

  const telephoneDestination = estEtape1
    ? premiereCommande.telephone_pecheur
    : premiereCommande.acheteur_detail?.telephone;

  const boutonActif = Boolean(etape.prochainStatut) && !actionEnCours;

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        {/* HEADER */}
        <header className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-6">
          <button
            onClick={() => navigate('/livreur/accueil')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            aria-label="Retour"
          >
            <ArrowLeft size={20} className="text-stone-700" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold text-[#0F2A4A]">
              Livraison en cours
            </h1>
            <p className="text-xs text-stone-500">
              Réf. #{livraison.id} ·{' '}
              {new Intl.NumberFormat('fr-FR').format(
                livraison.tarif_livraison || 0
              )}{' '}
              FCFA
            </p>
          </div>
        </header>

        <main className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 pb-32">

          {/* ═══════════ CARTE + ITINÉRAIRE ═══════════ */}
          <CarteInteractive
            positionLivreur={positionLivreur}
            positionPecheur={positionPecheur}
            positionClient={positionClient}
            destination={estEtape1 ? 'pecheur' : 'client'}
            afficherItineraire
            onItineraireCalcule={(info) => setItineraire(info)}
            className="h-56 shadow-sm"
          />

          {/* Infos itinéraire */}
          {itineraire && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-600">
                <MapPin size={14} className="text-[#FF6B4A]" />
                {estEtape1 ? 'Vers le pêcheur' : 'Vers le client'}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  {itineraire.distance.toFixed(1)} km
                </span>
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                  ~{itineraire.duree} min
                </span>
              </div>
            </div>
          )}

          {/* ÉTAPE / PROGRESSION */}
          <div className="overflow-hidden rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Progression
            </p>
            <h2 className="mt-1 text-base font-black text-[#0F2A4A]">
              Étape {etape.etapeVisuelle} sur 3 · {etape.titre}
            </h2>
            <p className="mt-0.5 text-[11px] text-stone-500">
              {etape.sousTitre}
            </p>

            <div className="mt-4 flex items-center gap-1.5">
              {ETAPES_VISUELLES.map((e, idx) => {
                const atteinte = e.numero <= etape.etapeVisuelle;
                const IconStep = e.icon;
                return (
                  <React.Fragment key={e.numero}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ${
                          atteinte
                            ? 'bg-[#0C3B4A] text-white'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        <IconStep size={15} />
                      </div>
                      <span
                        className={`text-[9px] font-bold ${
                          atteinte ? 'text-[#0C3B4A]' : 'text-stone-400'
                        }`}
                      >
                        {e.label}
                      </span>
                    </div>
                    {idx < ETAPES_VISUELLES.length - 1 && (
                      <div
                        className={`mb-4 h-0.5 flex-1 rounded-full transition-all duration-500 ${
                          e.numero < etape.etapeVisuelle
                            ? 'bg-[#0C3B4A]'
                            : 'bg-stone-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* DESTINATION */}
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {estEtape1 ? 'Pêcheur référent' : 'Client à livrer'}
            </p>

            <div className="flex items-center gap-3">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${
                  estEtape1 ? 'bg-[#0C3B4A]' : 'bg-[#0A8A5F]'
                }`}
              >
                {nomDestination.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-[#0F2A4A]">
                  {nomDestination}
                </p>
                <p className="flex items-center gap-1 truncate text-[11px] text-stone-500">
                  <MapPin size={10} />
                  {adresseDestination}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (telephoneDestination) {
                  window.location.href = `tel:${telephoneDestination}`;
                }
              }}
              disabled={!telephoneDestination}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-100 py-3 text-xs font-bold text-[#0C3B4A] transition hover:bg-stone-200 active:scale-[0.98] disabled:opacity-40"
            >
              <Phone size={14} />
              Appeler {estEtape1 ? 'le pêcheur' : 'le client'}
            </button>
          </div>

          {/* PRODUITS */}
          <div className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {estEtape1 ? 'À récupérer' : 'À livrer'} ({commandes.length})
            </p>
            {commandes.map((cmd, idx) => {
              const prod = cmd.lignes?.[0]?.produit_detail || {};
              const img =
                prod.media ||
                'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=100';
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=100';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0F2A4A]">
                      {prod.nom || 'Produit'}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {cmd.lignes?.[0]?.quantite} kg
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-600">
                    {cmd.lignes?.[0]?.quantite} kg
                  </span>
                </div>
              );
            })}
          </div>

          {/* ERREUR */}
          {erreur && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {erreur}
            </div>
          )}

          {/* SUCCÈS */}
          {livraison.statut === 'livree' && (
            <div className="flex flex-col items-center rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check size={28} strokeWidth={3} />
              </div>
              <p className="text-sm font-black text-emerald-800">
                Livraison terminée
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Le client a bien reçu sa commande.
              </p>
            </div>
          )}
        </main>

        {/* BOUTON PRINCIPAL */}
        {etape.labelBouton && (
          <div className="absolute bottom-20 left-4 right-4 z-20">
            <button
              onClick={handleActionPrincipale}
              disabled={!boutonActif}
              style={{ backgroundColor: etape.couleur }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white shadow-xl transition active:scale-[0.98] disabled:opacity-60"
            >
              <Icone size={18} />
              {actionEnCours ? 'Traitement...' : etape.labelBouton}
              {!actionEnCours && etape.prochainStatut && (
                <ChevronRight size={16} />
              )}
            </button>
          </div>
        )}

        {/* LIVRÉE : bouton résumé */}
        {livraison.statut === 'livree' && (
          <div className="absolute bottom-20 left-4 right-4 z-20">
            <button
              onClick={() => navigate('/livreur/livraison-terminee')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0C3B4A] py-4 text-sm font-black text-white shadow-xl transition active:scale-[0.98]"
            >
              <Check size={18} strokeWidth={3} />
              Voir le résumé
            </button>
          </div>
        )}

        <LivreurBottomNav />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Géocodage d'adresse via Nominatim (fallback)
// ═══════════════════════════════════════════════════════════
async function geocoderAdresse(adresse) {
  if (!adresse) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse + ', Dakar, Sénégal')}&limit=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await res.json();
    if (data?.[0]) {
      return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
    }
  } catch (err) {
    console.warn('Géocodage échoué:', err);
  }
  return null;
}