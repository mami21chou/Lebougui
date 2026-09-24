import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, MessageSquare, Navigation,
} from 'lucide-react';
import API from '../../services/api';
import { CommandeService } from '../../services/commandeService';
import LivreurBottomNav from '../../components/LivreurBottomNav';
import CarteInteractive from '../../components/CarteInteractive';

export default function LivraisonGPS() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [livraison, setLivraison] = useState(null);
  const [positionLivreur, setPositionLivreur] = useState(null);
  const [positionClient, setPositionClient] = useState(null);
  const [itineraire, setItineraire] = useState(null);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  // Chargement livraison
  useEffect(() => {
    const load = async () => {
      try {
        const res = (await API.get('/livraisons/en-cours/')).data;
        if (res.en_cours) {
          setLivraison(res.en_cours);
          const c = res.en_cours.commandes_detail?.[0];
          if (c?.latitude_livraison && c?.longitude_livraison) {
            setPositionClient({
              lat: Number(c.latitude_livraison),
              lng: Number(c.longitude_livraison),
            });
          }
        }
      } catch (err) {
        console.warn('Erreur chargement livraison:', err);
        setErreur('Impossible de charger la livraison.');
      }
    };
    load();
  }, [id]);

  // Géolocalisation livreur
  useEffect(() => {
    if (!navigator.geolocation) {
      setErreur('Géolocalisation non supportée.');
      return;
    }

    const onSuccess = (pos) => {
      setPositionLivreur({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      setErreur('');
    };

    const onError = () => {
      setErreur('Impossible de vous localiser. Autorisez la géolocalisation.');
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const watch = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });

    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  const arriver = async () => {
    if (actionEnCours) return;
    setActionEnCours(true);
    try {
      await CommandeService.terminerLivraison(livraison.id);
      navigate('/livreur/livraison-terminee');
    } catch (err) {
      alert(
        err.response?.data?.erreur ||
          err.response?.data?.detail ||
          'Erreur lors de la validation'
      );
    } finally {
      setActionEnCours(false);
    }
  };

  if (!livraison) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B4A] border-t-transparent" />
      </div>
    );
  }

  const client = livraison.commandes_detail?.[0] || {};

  return (
    <div className="min-h-screen bg-stone-300 font-sans antialiased sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#FAF6F0] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-8 sm:border-stone-300 sm:shadow-2xl">

        <header className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-6">
          <button
            onClick={() => navigate(`/livreur/livraison/${id}/recuperer`)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            aria-label="Retour"
          >
            <ArrowLeft size={20} className="text-stone-700" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-extrabold text-[#0F2A4A]">
              En route vers le client
            </h1>
            <p className="truncate text-xs text-stone-500">
              {client.adresse_livraison || 'Adresse client'}
            </p>
          </div>
        </header>

        <div className="relative flex-1">
          <CarteInteractive
            positionLivreur={positionLivreur}
            positionClient={positionClient}
            destination="client"
            afficherItineraire
            onItineraireCalcule={(info) => setItineraire(info)}
            className="h-full w-full rounded-none"
          />

          {itineraire && (
            <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Destination
                </p>
                <p className="truncate text-sm font-black text-[#0F2A4A]">
                  {client.acheteur_detail?.prenom} {client.acheteur_detail?.nom}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 pl-3">
                <div className="text-right">
                  <p className="text-xs font-black text-[#FF6B4A]">
                    {itineraire.distance.toFixed(1)} km
                  </p>
                  <p className="text-[10px] text-stone-500">
                    ~{itineraire.duree} min
                  </p>
                </div>
              </div>
            </div>
          )}

          {erreur && (
            <div className="absolute left-4 right-4 top-20 z-20 rounded-2xl border border-amber-200 bg-amber-50/95 p-3 text-xs font-medium text-amber-800 shadow-lg backdrop-blur-md">
              {erreur}
            </div>
          )}
        </div>

        <div className="shrink-0 space-y-3 border-t border-stone-100 bg-[#FAF6F0] px-5 py-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0A8A5F] text-sm font-bold text-white">
              {client.acheteur_detail?.prenom?.charAt(0) || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#0F2A4A]">
                {client.acheteur_detail?.prenom} {client.acheteur_detail?.nom}
              </p>
              <p className="flex items-center gap-1 truncate text-[11px] text-stone-500">
                <MapPin size={10} />
                {client.adresse_livraison}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => {
                  if (client.acheteur_detail?.telephone) {
                    window.location.href = `tel:${client.acheteur_detail.telephone}`;
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition active:scale-95"
                aria-label="Appeler"
              >
                <Phone size={15} />
              </button>
              <button
                onClick={() => {
                  if (client.acheteur_detail?.telephone) {
                    window.location.href = `sms:${client.acheteur_detail.telephone}`;
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-700 transition active:scale-95"
                aria-label="SMS"
              >
                <MessageSquare size={15} />
              </button>
            </div>
          </div>

          <button
            onClick={arriver}
            disabled={actionEnCours}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-4 text-sm font-black text-white shadow-xl transition active:scale-[0.98] disabled:opacity-60"
          >
            <Navigation size={18} />
            {actionEnCours
              ? 'Validation en cours...'
              : 'Je suis arrivé chez le client'}
          </button>
        </div>

        <LivreurBottomNav />
      </div>
    </div>
  );
}