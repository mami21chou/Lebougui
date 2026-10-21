
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Mic, Video, Play, Pause,
  Clock, ChevronLeft, ChevronRight,
  BadgeCheck, MapPin, Volume2,
  ChevronRight as ArrowRight, ChevronDown,
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

const INFOS_LIMIT = 3;
const PRODUITS_PREVIEW = 6;

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

const formatRelative = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const j = Math.floor(h / 24);
  return `il y a ${j}j`;
};

const formatPrice = (p) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(p) || 0)} F`;

const initiales = (prenom = '', nom = '') =>
  `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase() || 'P';

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
  const [voirTousProduits, setVoirTousProduits] = useState(false);

  const produitsRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % IMAGES_SENEGAL.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
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
        console.error('Erreur chargement:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const requireAuthAction = (cb) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = `/connexion?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      return;
    }
    cb();
  };

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

  const toggleAudio = (e, id, url) => {
    e.stopPropagation();
    if (!url) return;
    const key = `audio-${id}`;
    if (audioEnCours === key) pauseAudio();
    else playAudio(key, url);
  };

  const isPlaying = (id) => audioEnCours === `audio-${id}`;

  const handleVoirPlusProduits = () => {
    setVoirTousProduits((prev) => {
      const nouveau = !prev;
      if (!nouveau) {
        setTimeout(() => {
          produitsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 100);
      }
      return nouveau;
    });
  };

  const infosAffichees = informations.slice(0, INFOS_LIMIT);
  const produitsAffiches = voirTousProduits
    ? produits
    : produits.slice(0, PRODUITS_PREVIEW);

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-[#F7F4EF] pb-28 font-sans text-slate-800 shadow-2xl">
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
        <section className="relative -mx-5 -mt-9 h-[calc(50vh-80px)] min-h-[420px] overflow-hidden">
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

        {/* ==================== BLOC VOCAL ==================== */}
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

            <button
              onClick={() => requireAuthAction(() => setShowRecorder(true))}
              className="group relative"
            >
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



               {/* ==================== INFORMATIONS ==================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Informations du jour
            </h3>
            <button
              onClick={() => navigate('/pecheur/informations')}
              className="flex items-center gap-0.5 text-[11px] font-bold text-orange-500 transition hover:text-orange-600"
            >
              Voir tout
              <ArrowRight size={12} />
            </button>
          </div>

          {loading ? (
            <p className="text-xs italic text-slate-400">Chargement…</p>
          ) : infosAffichees.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 text-center shadow-sm">
              <Volume2 size={24} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs text-slate-400">Aucune information aujourd'hui.</p>
            </div>
          ) : (
            infosAffichees.map((info) => {
              const playing = isPlaying(`info-${info.id}`);
              return (
                <div
                  key={info.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center gap-3 p-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0C3B4A] to-teal-600 text-sm font-black text-white shadow-sm">
                      {initiales(info.pecheur_prenom, info.pecheur_nom)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {info.pecheur_prenom} {info.pecheur_nom}
                        </p>
                        {info.pecheur_est_premium && (
                          <BadgeCheck size={14} className="shrink-0 text-teal-500" />
                        )}
                      </div>
                      <p className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                        <MapPin size={10} />
                        {info.adresse || 'Zone non précisée'}
                        <span>·</span>
                        <Clock size={10} />
                        {formatRelative(info.date_publication)}
                      </p>
                    </div>
                  </div>

                  {info.audio && (
                    <button
                      type="button"
                      onClick={(e) => toggleAudio(e, `info-${info.id}`, info.audio)}
                      className="flex w-full items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-3.5 py-3 transition hover:bg-slate-100"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                          playing
                            ? 'bg-[#FF6B4A] text-white'
                            : 'bg-white text-[#0C3B4A] shadow-sm ring-1 ring-slate-200'
                        }`}
                      >
                        {playing ? (
                          <Pause size={14} fill="currentColor" />
                        ) : (
                          <Play size={14} fill="currentColor" className="ml-0.5" />
                        )}
                      </span>
                      <span className="flex-1 text-left">
                        <span className="block text-xs font-bold text-slate-700">
                          {playing ? 'En lecture…' : 'Écouter la note vocale'}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Vocal wolof
                        </span>
                      </span>
                      <Volume2 size={16} className="text-slate-400" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>     


        {/* ==================== LE MARCHÉ DU JOUR ==================== */}
        <div ref={produitsRef} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Le marché du jour
            </h3>
            <span className="text-[10px] font-medium text-slate-400">
              {produitsAffiches.length} / {produits.length}
            </span>
          </div>

          {loading ? (
            <p className="text-xs italic text-slate-400">Chargement…</p>
          ) : produitsAffiches.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 text-center shadow-sm">
              <p className="text-xs text-slate-400">Aucun produit disponible.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {produitsAffiches.map((item) => {
                  const playing = isPlaying(`prod-${item.id}`);
                  const hasAudio = Boolean(item.audio);
                  const sellerName =
                    `${item.pecheur_prenom || ''} ${
                      item.pecheur_nom || ''
                    }`.trim() || 'Pêcheur';

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
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-[0.98]"
                    >
                      {/* Image + bouton audio */}
                      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                        <img
                          src={item.media || item.image || FALLBACK_IMAGE}
                          alt={item.nom}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_IMAGE;
                          }}
                        />

                        {hasAudio && (
                          <button
                            type="button"
                            onClick={(e) =>
                              toggleAudio(e, `prod-${item.id}`, item.audio)
                            }
                            className={`absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full transition ${
                              playing
                                ? 'bg-[#FF6B4A] text-white'
                                : 'bg-white/90 text-[#0C3B4A] backdrop-blur-sm hover:bg-white'
                            }`}
                            aria-label="Écouter"
                          >
                            {playing ? (
                              <Pause size={12} fill="currentColor" />
                            ) : (
                              <Play
                                size={12}
                                fill="currentColor"
                                className="ml-0.5"
                              />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Contenu sous l'image */}
                      <div className="flex flex-1 flex-col gap-2 p-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0C3B4A] text-[8px] font-bold text-white">
                            {initiales(item.pecheur_prenom, item.pecheur_nom)}
                          </div>
                          <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-slate-600">
                            {sellerName}
                          </span>
                          {item.pecheur_est_premium && (
                            <BadgeCheck
                              size={12}
                              className="shrink-0 text-sky-500"
                              aria-label="Pêcheur vérifié"
                            />
                          )}
                        </div>

                        <h4 className="truncate text-xs font-bold text-slate-900">
                          {item.nom}
                        </h4>

                        <div className="mt-auto flex items-baseline gap-1">
                          <span className="text-sm font-black text-[#0C3B4A]">
                            {formatPrice(item.prix)}
                          </span>
                          <span className="text-[9px] font-medium text-slate-400">
                            / {item.unite || 'kg'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bouton Voir plus / Voir moins */}
              {produits.length > PRODUITS_PREVIEW && (
                <button
                  onClick={handleVoirPlusProduits}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
                >
                  <span>
                    {voirTousProduits
                      ? 'Voir moins'
                      : `Voir plus (${produits.length - PRODUITS_PREVIEW} de plus)`}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      voirTousProduits ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}
            </>
          )}
        </div>

      </main>

      <PecheurBottomNav />

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