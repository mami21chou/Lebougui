import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Navigation, RefreshCw, Info, Crosshair, MapPin,
} from 'lucide-react';
import CarteInteractive from '../../components/CarteInteractive';
import LivreurBottomNav from '../../components/LivreurBottomNav';
import API from '../../services/api';

const reverseCache = new Map();

const reverseGeocoder = async (lat, lng) => {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (reverseCache.has(key)) return reverseCache.get(key);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=fr`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const adresse = data?.address || {};

    const morceaux = [
      adresse.road || adresse.pedestrian || adresse.footway,
      adresse.suburb || adresse.neighbourhood || adresse.village,
      adresse.city || adresse.town || adresse.county,
    ].filter(Boolean);

    const libelle = morceaux.length
      ? morceaux.slice(0, 2).join(', ')
      : data?.display_name?.split(',').slice(0, 2).join(', ') || null;

    if (libelle) reverseCache.set(key, libelle);
    return libelle;
  } catch (err) {
    console.warn('Reverse geocoding échoué:', err);
    return null;
  }
};

export default function LivreurGPS() {
  const navigate = useNavigate();
  const [position, setPosition] = useState(null);
  const [precision, setPrecision] = useState(null);
  const [adresse, setAdresse] = useState(null);
  const [chargementAdresse, setChargementAdresse] = useState(false);
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(null);
  const [derniereMaj, setDerniereMaj] = useState(null);

  useEffect(() => {
    const verifier = async () => {
      try {
        const res = (await API.get('/livraisons/en-cours/')).data;
        if (res?.en_cours) setEnCours(res.en_cours);
      } catch {}
    };
    verifier();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setErreur("La géolocalisation n'est pas disponible.");
      return;
    }

    const onSuccess = (pos) => {
      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      setPrecision(pos.coords.accuracy);
      setDerniereMaj(new Date());
      setErreur('');
    };

    const onError = (err) => {
      if (err.code === 1)
        setErreur('Autorisation refusée. Activez la géolocalisation.');
      else if (err.code === 2)
        setErreur('Position indisponible. Vérifiez votre GPS.');
      else setErreur("Impossible d'obtenir votre position.");
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const watch = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000,
    });

    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  useEffect(() => {
    if (!position) return;

    let cancelled = false;
    const key = `${position.lat.toFixed(4)},${position.lng.toFixed(4)}`;

    if (reverseCache.has(key) && adresse === reverseCache.get(key)) return;

    setChargementAdresse(true);

    const timer = setTimeout(async () => {
      const label = await reverseGeocoder(position.lat, position.lng);
      if (!cancelled) {
        setAdresse(label);
        setChargementAdresse(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [position?.lat, position?.lng]);

  const recentrer = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setPrecision(pos.coords.accuracy);
        setDerniereMaj(new Date());
        setErreur('');
      },
      () => setErreur('Impossible de recentrer.'),
      { enableHighAccuracy: true }
    );
  };

  const formatHeure = (d) =>
    d
      ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '—';

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        <div className="relative w-full" style={{ height: 'calc(80% - 48px)' }}>
          <CarteInteractive
            positionLivreur={position}
            positionClient={null}
            afficherItineraire={false}
            className="h-full w-full"
          />

          <header className="absolute left-4 right-4 top-4 z-20 flex items-center gap-3">
            <button
              onClick={() => navigate('/livreur/accueil')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-lg transition hover:bg-stone-50 active:scale-95"
              aria-label="Retour"
            >
              <ArrowLeft size={20} className="text-stone-700" />
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-between rounded-full bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  Ma position
                </p>
                <p className="truncate text-xs font-black text-[#0F2A4A]">
                  {enCours
                    ? `${enCours.commandes_detail?.length || 0} commande(s) en cours`
                    : 'Aucune course'}
                </p>
              </div>
              <div
                className={`ml-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                  position ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'
                }`}
              />
            </div>
          </header>

          <button
            onClick={recentrer}
            className="absolute right-4 top-20 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0C3B4A] shadow-lg transition hover:bg-stone-50 active:scale-95"
            aria-label="Recentrer la carte"
          >
            <Crosshair size={20} />
          </button>

          {erreur && (
            <div className="absolute left-4 right-4 top-20 z-20 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/95 p-3 text-xs font-medium text-amber-800 shadow-lg backdrop-blur-md">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span className="flex-1">{erreur}</span>
            </div>
          )}

          {enCours && (
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-orange-600">
                  Course en cours
                </p>
                <p className="truncate text-sm font-black text-[#0F2A4A]">
                  {enCours.commandes_detail?.length || 0} commande(s) à livrer
                </p>
              </div>
              <button
                onClick={() =>
                  navigate(`/livreur/livraison/${enCours.id}/recuperer`)
                }
                className="shrink-0 rounded-xl bg-[#FF6B4A] px-4 py-2.5 text-[11px] font-black text-white shadow-sm transition hover:bg-[#E85A39] active:scale-95"
              >
                Reprendre
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 bg-white">
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF6B4A] text-white shadow-sm">
                <MapPin size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  Vous êtes ici
                </p>
                {chargementAdresse && !adresse ? (
                  <p className="flex items-center gap-1.5 text-sm font-bold text-stone-400">
                    <RefreshCw size={12} className="animate-spin" />
                    Recherche de l'adresse...
                  </p>
                ) : adresse ? (
                  <p className="text-sm font-black leading-tight text-[#0F2A4A]">
                    {adresse}
                  </p>
                ) : position ? (
                  <p className="text-sm font-bold text-stone-400">
                    Adresse non identifiée
                  </p>
                ) : (
                  <p className="text-sm font-bold text-stone-400">
                    Localisation en cours...
                  </p>
                )}
              </div>
              {position && (
                <div className="shrink-0 text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                    Précision
                  </p>
                  <p className="text-xs font-black text-emerald-600">
                    ±{Math.round(precision || 0)} m
                  </p>
                </div>
              )}
            </div>

            {position && (
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-stone-50 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-stone-600">
                  <Navigation size={10} className="text-stone-400" />
                  {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                </div>
                {derniereMaj && (
                  <div className="flex items-center gap-1 text-[9px] font-medium text-stone-400">
                    <RefreshCw size={9} />
                    {formatHeure(derniereMaj)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <LivreurBottomNav />
      </div>
    </div>
  );
}