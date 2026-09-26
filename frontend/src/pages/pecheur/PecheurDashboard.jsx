import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Mic, Video, Play, Pause,
  Clock, ChevronLeft, ChevronRight,
} from 'lucide-react';
import AudioRecorderModal from '../../components/AudioRecorderModal';
import PecheurHeader from '../../components/PecheurHeader';
import PecheurBottomNav from '../../components/PecheurBottomNav';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import { PublicationService } from '../../services/publicationService';

const IMAGES_SENEGAL = [
  'https://i.pinimg.com/736x/ae/19/51/ae19510120cbb67b086df77dea2e170e.jpg',
  'https://i.pinimg.com/1200x/4c/12/a8/4c12a86f3b74e807c3ce999653e5e39e.jpg',
  'https://i.pinimg.com/1200x/2f/11/a7/2f11a76af1e91323208ff785b2140d83.jpg',
  'https://i.pinimg.com/736x/25/56/9b/25569bf1becb4a347c0e490aaa301e99.jpg',
  'https://i.pinimg.com/736x/f3/7e/e0/f37ee0edeb9e29cbfa8cfb04924fbd75.jpg',
  'https://i.pinimg.com/1200x/19/94/12/199412425208b6fed7e1f43117c75876.jpg',
];

const FALLBACK_IMAGE = '/images/fallback.png';

const estAujourdhui = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

export default function PecheurDashboard() {
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const { currentId: audioEnCours, play: playAudio, pause: pauseAudio } = useAudio();

  const [showRecorder, setShowRecorder] = useState(false);
  const [produits, setProduits] = useState([]);
  const [informations, setInformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingAudio, setPendingAudio] = useState(null);

  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % IMAGES_SENEGAL.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [produitsRes, infosRes] = await Promise.all([
          PublicationService.getMarche(),
          PublicationService.getInformationsPeche(),
        ]);

        setProduits(produitsRes || []);

        const infosDuJour = (infosRes || [])
          .filter((info) => estAujourdhui(info.date_publication))
          .sort(
            (a, b) =>
              new Date(b.date_publication).getTime() -
              new Date(a.date_publication).getTime()
          );

        setInformations(infosDuJour);
      } catch (err) {
        console.error('Erreur de chargement des données du marché:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const requireAuthAction = (actionCallback) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = `/connexion?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      return;
    }
    actionCallback();
  };

  const handleOpenRecorder = () =>
    requireAuthAction(() => setShowRecorder(true));

  const handleAudioCaptured = (blob) => {
    setShowRecorder(false);
    navigate('/publication/nouvelle', {
      state: { audioBlob: blob, photoFile: null },
    });
  };

  const handleFinishAndAddPhoto = (blob) => {
    setShowRecorder(false);
    setPendingAudio(blob);
    document.getElementById('dashboard-photo-input')?.click();
  };

  const handlePhotoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file || !pendingAudio) return;
    navigate('/publication/nouvelle', {
      state: { audioBlob: pendingAudio, photoFile: file },
    });
    e.target.value = '';
  };

  const toggleProduitAudio = (e, produit) => {
    e.stopPropagation();
    if (!produit.audio) return;
    const id = `pecheur-market-${produit.id}`;
    if (audioEnCours === id) {
      pauseAudio();
    } else {
      playAudio(id, produit.audio);
    }
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-[#F7F4EF] pb-24 font-sans text-slate-800 shadow-2xl">
      {/* HEADER — sans vague, pour coller au carrousel */}
      <PecheurHeader
        title={`Bonjour, ${utilisateur?.prenom || 'Pêcheur'}`}
        subtitle="Soumbédioune · Dakar"
        rightIcon="bell"
        showWave={false}
        onRightIconClick={() =>
          requireAuthAction(() => navigate('/pecheur/notifications'))
        }
      />

      <main className="space-y-6 px-5 pt-2">

        {/* ==================== HERO IMMERSIF ==================== */}
        {/* -mt-9 compense le padding bas (pb-9) du header bleu pour coller le carrousel */}
        <section className="relative -mx-5 -mt-9 h-[calc(70vh-80px)] min-h-[620px] overflow-hidden">
          {IMAGES_SENEGAL.map((img, idx) => (
            <img
              key={img}
              src={img}
              alt="Pêche sénégalaise"
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1500ms] ${
                idx === currentImageIdx
                  ? 'scale-100 opacity-100'
                  : 'scale-105 opacity-0'
              }`}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/70" />

          <div className="absolute bottom-10 left-5 right-5">
            <div className="max-w-[320px]">
              <h2 className="text-3xl font-black leading-[1.05] text-white drop-shadow-lg">
                La mer.
                <br />
                Le pêcheur.
                <br />
                Votre table.
              </h2>
              <p className="mt-3 max-w-[270px] text-xs leading-relaxed text-white/80">
                Découvrez les produits frais directement auprès des pêcheurs.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setCurrentImageIdx((prev) =>
                prev === 0 ? IMAGES_SENEGAL.length - 1 : prev - 1
              )
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/20 p-2 text-white backdrop-blur-md"
            aria-label="Image précédente"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() =>
              setCurrentImageIdx((prev) => (prev + 1) % IMAGES_SENEGAL.length)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/20 p-2 text-white backdrop-blur-md"
            aria-label="Image suivante"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {IMAGES_SENEGAL.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIdx(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentImageIdx
                    ? 'w-6 bg-[#FF6B4A]'
                    : 'w-1.5 bg-white/60'
                }`}
                aria-label={`Image ${idx + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ==================== BLOC PUBLICATION VOCALE ==================== */}
        <div className="space-y-4 rounded-3xl border border-slate-200/60 bg-white p-6 text-center shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Publier</h3>

          <div className="flex items-center justify-center gap-6">
            <input
              id="dashboard-photo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelected}
            />

            <button
              onClick={() => requireAuthAction(() => setShowRecorder(true))}
              className="rounded-full bg-slate-100 p-3 text-slate-600 transition-colors hover:bg-slate-200"
            >
              <Camera size={20} />
            </button>

            <button onClick={handleOpenRecorder} className="group relative">
              <div className="absolute -inset-2 rounded-full bg-orange-500/20 blur-sm transition-all group-hover:bg-orange-500/30" />
              <div className="relative flex h-20 w-20 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 transition-transform active:scale-95">
                <Mic size={28} />
                <span className="mt-0.5 text-[9px] font-black uppercase tracking-wider">
                  WOLOF
                </span>
              </div>
            </button>

            <button
              onClick={() => requireAuthAction(() => setShowRecorder(true))}
              className="rounded-full bg-slate-100 p-3 text-slate-600 transition-colors hover:bg-slate-200"
            >
              <Video size={20} />
            </button>
          </div>

          <p className="text-xs font-bold tracking-wide text-slate-700">
            Waxal ci wolof
          </p>
        </div>

        {/* ==================== INFORMATIONS DE PÊCHE — AUJOURD'HUI ==================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              INFORMATIONS DE PÊCHE
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
              Aujourd'hui
            </span>
          </div>

          {loading ? (
            <p className="text-xs italic text-slate-400">
              Chargement des alertes...
            </p>
          ) : informations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center shadow-sm">
              <p className="text-xs text-slate-400">
                Aucune information publiée aujourd'hui.
              </p>
            </div>
          ) : (
            informations.map((info) => (
              <div
                key={info.id}
                className="space-y-2 rounded-2xl border-y border-r border-l-4 border-slate-200/60 border-l-teal-500 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                      {(info.pecheur_prenom?.[0] || 'P').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-slate-900">
                        {info.adresse || 'Zone de Pêche'}
                      </h4>
                      <p className="truncate text-[10px] text-slate-400">
                        {info.pecheur_prenom} {info.pecheur_nom}
                      </p>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={10} />
                    {new Date(info.date_publication).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs italic text-slate-700">
                  « {info.texte_transcrit || 'Aucune transcription'} »
                </div>

                {info.audio && (
                  <audio
                    controls
                    src={info.audio}
                    className="h-9 w-full rounded-lg"
                    preload="none"
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* ==================== LE MARCHÉ DU JOUR ==================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              LE MARCHÉ DU JOUR
            </h3>
            <button
              onClick={() => navigate('/pecheur/marche')}
              className="text-xs font-bold text-orange-500"
            >
              Voir tout
            </button>
          </div>

          {loading ? (
            <p className="text-xs italic text-slate-400">
              Chargement des produits...
            </p>
          ) : produits.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center shadow-sm">
              <p className="text-xs text-slate-400">Aucun produit disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {produits.slice(0, 4).map((item) => {
                const audioId = `pecheur-market-${item.id}`;
                const isPlaying = audioEnCours === audioId;
                const hasAudio = Boolean(item.audio);

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/acheteur/produit/${item.id}`)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      navigate(`/acheteur/produit/${item.id}`)
                    }
                    className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition active:scale-[0.98]"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
                      <img
                        src={item.media || item.image || FALLBACK_IMAGE}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_IMAGE;
                        }}
                      />

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/40 to-transparent" />

                      {hasAudio && (
                        <button
                          type="button"
                          onClick={(e) => toggleProduitAudio(e, item)}
                          aria-label={
                            isPlaying ? 'Pause' : 'Lecture de la note vocale'
                          }
                          className={`absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition ${
                            isPlaying
                              ? 'bg-[#FF6B4A] text-white'
                              : 'bg-black/50 text-white hover:bg-black/65'
                          }`}
                        >
                          {isPlaying ? (
                            <Pause size={13} fill="currentColor" />
                          ) : (
                            <Play size={13} fill="currentColor" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <PecheurBottomNav />
        </div>
        
      </main>
      

      {showRecorder && (
        <AudioRecorderModal
          onCancel={() => setShowRecorder(false)}
          onAudioCaptured={handleAudioCaptured}
          onFinishAndAddPhoto={handleFinishAndAddPhoto}
        />
      )}
    </div>
  );
}